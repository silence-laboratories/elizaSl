interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}
export declare class HttpClient {
    private readonly baseURL;
    private defaultHeaders;
    constructor(baseURL?: string);
    setDefaultHeaders(headers: Record<string, string>): void;
    private buildUrl;
    private handleResponse;
    private request;
    get<T>(endpoint: string, options?: RequestOptions): Promise<T>;
    post<T, D = unknown>(endpoint: string, data: D, options?: RequestOptions): Promise<T>;
    put<T, D = unknown>(endpoint: string, data: D, options?: RequestOptions): Promise<T>;
    patch<T, D = unknown>(endpoint: string, data: D, options?: RequestOptions): Promise<T>;
    delete<T>(endpoint: string, options?: RequestOptions): Promise<T>;
}
export {};
