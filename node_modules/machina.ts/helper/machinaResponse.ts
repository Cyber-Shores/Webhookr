export interface MachinaResponse<T> {
    value: T, 
    reason?: string
    extra?: any
}