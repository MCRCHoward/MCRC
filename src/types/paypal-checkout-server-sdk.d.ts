/**
 * Type declarations for @paypal/checkout-server-sdk
 * This package doesn't include TypeScript definitions
 */

declare module '@paypal/checkout-server-sdk' {
  export namespace core {
    export class SandboxEnvironment {
      constructor(clientId: string, clientSecret: string)
    }

    export class LiveEnvironment {
      constructor(clientId: string, clientSecret: string)
    }

    export class PayPalHttpClient {
      constructor(environment: SandboxEnvironment | LiveEnvironment)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      execute<T = any>(request: any): Promise<{ statusCode: number; result: T }>
    }
  }

  export namespace orders {
    export class OrdersCreateRequest {
      prefer(value: string): void
      requestBody(body: {
        intent: string
        purchase_units: Array<{
          description?: string
          amount: {
            currency_code: string
            value: string
          }
        }>
        application_context?: {
          brand_name?: string
          landing_page?: string
          user_action?: string
          return_url?: string
          cancel_url?: string
        }
      }): void
    }

    export class OrdersCaptureRequest {
      constructor(orderId: string)
      requestBody(body: Record<string, unknown>): void
    }
  }
}

