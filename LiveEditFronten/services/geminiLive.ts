import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';

interface GeminiLiveConfig {
  apiKey: string;
  onAudioResponse: (audioData: ArrayBuffer) => void;
  onTextResponse: (text: string) => void;
  onError: (error: Error) => void;
  onInterrupted?: () => void;
}

export class GeminiLiveService {
  private genAI: GoogleGenAI;
  private isInitialized = false;
  private isProcessing: boolean = false;
  private currentStream: AsyncGenerator<GenerateContentResponse> | null = null;
  private config: GeminiLiveConfig;
  private audioContext: AudioContext | null = null;

  constructor(config: GeminiLiveConfig) {
    this.config = config;
    this.genAI = new GoogleGenAI({ apiKey: this.config.apiKey });
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async processVoiceCommand(audioBlob: Blob, userPrompt: string) {
    this.isProcessing = true;

    try {
      if (!this.isInitialized) {
        throw new Error('Gemini model not initialized');
      }

      // Convert audio blob to base64
      const audioData = await this.blobToBase64(audioBlob);

      // Create multimodal prompt
      const parts = [
        { text: userPrompt },
        {
          inlineData: {
            mimeType: audioBlob.type,
            data: audioData,
          },
        },
      ];

      // Generate streaming response
      const stream = await this.genAI.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents: [{ role: 'user', parts }],
        config: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
      this.currentStream = stream;

      let fullText = '';
      
      for await (const chunk of stream) {
        // Check if interrupted
        if (!this.isProcessing) {
          this.config.onInterrupted?.();
          break;
        }

        const chunkText = chunk.text ?? '';
        if (!chunkText) continue;
        fullText += chunkText;
        this.config.onTextResponse(chunkText);
      }

      // If text-to-speech is needed, process the full text
      if (this.isProcessing && fullText) {
        await this.synthesizeSpeech(fullText);
      }

    } catch (error) {
      this.config.onError(this.toError(error));
    } finally {
      this.isProcessing = false;
    }
  }

  async processTextCommand(prompt: string) {
    this.isProcessing = true;

    try {
      if (!this.isInitialized) {
        throw new Error('Gemini model not initialized');
      }

      const stream = await this.genAI.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
        config: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
        },
      });
      this.currentStream = stream;

      let fullText = '';
      
      for await (const chunk of stream) {
        if (!this.isProcessing) {
          this.config.onInterrupted?.();
          break;
        }

        const chunkText = chunk.text ?? '';
        if (!chunkText) continue;
        fullText += chunkText;
        this.config.onTextResponse(chunkText);
      }

    } catch (error) {
      this.config.onError(this.toError(error));
    } finally {
      this.isProcessing = false;
    }
  }

  // Interrupt the current generation
  interrupt() {
    this.isProcessing = false;
    this.currentStream = null;
    this.config.onInterrupted?.();
  }

  // Convert blob to base64
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  // Synthesize speech from text (using Web Speech API)
  private async synthesizeSpeech(text: string) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Check for interruption
      const checkInterval = setInterval(() => {
        if (!this.isProcessing) {
          window.speechSynthesis.cancel();
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      utterance.onend = () => {
        clearInterval(checkInterval);
        resolve();
      };

      utterance.onerror = () => {
        clearInterval(checkInterval);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // Play audio buffer
  private async playAudioBuffer(audioBuffer: ArrayBuffer) {
    if (!this.audioContext) return;

    try {
      const audioBufferDecoded = await this.audioContext.decodeAudioData(audioBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBufferDecoded;
      source.connect(this.audioContext.destination);
      source.start(0);

      this.config.onAudioResponse(audioBuffer);
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  isActive() {
    return this.isProcessing;
  }

  destroy() {
    this.interrupt();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Hook for using Gemini Live in components
export const useGeminiLive = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [response, setResponse] = React.useState('');
  const [error, setError] = React.useState<Error | null>(null);
  const serviceRef = React.useRef<GeminiLiveService | null>(null);

  const initialize = async (apiKey: string) => {
    const service = new GeminiLiveService({
      apiKey,
      onTextResponse: (text) => {
        setResponse((prev) => prev + text);
      },
      onAudioResponse: () => {
        // Handle audio if needed
      },
      onError: (err) => {
        setError(err);
        setIsProcessing(false);
      },
      onInterrupted: () => {
        setIsProcessing(false);
      },
    });

    await service.initialize();
    serviceRef.current = service;
    setIsInitialized(true);
  };

  const processVoice = async (audioBlob: Blob, prompt: string) => {
    if (!serviceRef.current) return;
    setIsProcessing(true);
    setResponse('');
    setError(null);
    await serviceRef.current.processVoiceCommand(audioBlob, prompt);
  };

  const processText = async (prompt: string) => {
    if (!serviceRef.current) return;
    setIsProcessing(true);
    setResponse('');
    setError(null);
    await serviceRef.current.processTextCommand(prompt);
  };

  const interrupt = () => {
    if (serviceRef.current) {
      serviceRef.current.interrupt();
    }
  };

  React.useEffect(() => {
    return () => {
      if (serviceRef.current) {
        serviceRef.current.destroy();
      }
    };
  }, []);

  return {
    isInitialized,
    isProcessing,
    response,
    error,
    initialize,
    processVoice,
    processText,
    interrupt,
  };
};

// Fix for React import
import React from 'react';
