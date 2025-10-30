export interface OpenSignConfig {
  baseUrl: string;
  apiKey: string;
}

export interface CreateEnvelopeRequest {
  documentUrl: string;
  documentName: string;
  signers: Array<{
    name: string;
    email: string;
    order?: number;
  }>;
  subject?: string;
  message?: string;
  expiresInDays?: number;
  webhookUrl?: string;
}

export interface OpenSignEnvelope {
  id: string;
  status: 'draft' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired';
  signing_url: string;
  created_at: string;
  updated_at: string;
}

export class OpenSignClient {
  private config: OpenSignConfig;

  constructor(config: OpenSignConfig) {
    this.config = config;
  }

  async createEnvelope(data: CreateEnvelopeRequest): Promise<OpenSignEnvelope> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/envelopes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        ...data,
        expires_at: data.expiresInDays 
          ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenSign API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  async getEnvelope(envelopeId: string): Promise<OpenSignEnvelope> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/envelopes/${envelopeId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch envelope: ${response.statusText}`);
    }

    return await response.json();
  }

  async downloadSignedDocument(envelopeId: string): Promise<ArrayBuffer> {
    const response = await fetch(
      `${this.config.baseUrl}/api/v1/envelopes/${envelopeId}/download`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download signed document: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  }

  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/v1/envelopes/${envelopeId}/void`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to void envelope: ${response.statusText}`);
    }
  }
}
