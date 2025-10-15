import Foundation

/// Represents the loading state of an async operation
enum LoadingState<T> {
    case idle
    case loading
    case loaded(T)
    case failed(Error)

    // Computed properties for easy state checking
    var isIdle: Bool {
        if case .idle = self { return true }
        return false
    }

    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }

    var isLoaded: Bool {
        if case .loaded = self { return true }
        return false
    }

    var isFailed: Bool {
        if case .failed = self { return true }
        return false
    }

    // Get the value if loaded
    var value: T? {
        if case .loaded(let value) = self {
            return value
        }
        return nil
    }

    // Get the error if failed
    var error: Error? {
        if case .failed(let error) = self {
            return error
        }
        return nil
    }

    // Get user-friendly error message
    var errorMessage: String? {
        guard let error = error else { return nil }

        // Check if it's an R2Error with a user-friendly message
        if let r2Error = error as? R2Error {
            return r2Error.userMessage
        }

        // Otherwise, use localizedDescription
        return error.localizedDescription
    }

    // Map the value to a different type
    func map<U>(_ transform: (T) -> U) -> LoadingState<U> {
        switch self {
        case .idle:
            return .idle
        case .loading:
            return .loading
        case .loaded(let value):
            return .loaded(transform(value))
        case .failed(let error):
            return .failed(error)
        }
    }
}

// MARK: - R2 Error Types

enum R2Error: Error, LocalizedError {
    case networkError(String)
    case serverError(Int, String)
    case decodingError(String)
    case invalidResponse
    case unauthorized
    case notFound(String)
    case configurationError(String)
    case unknown

    var errorDescription: String? {
        switch self {
        case .networkError(let message):
            return "Network Error: \(message)"
        case .serverError(let code, let message):
            return "Server Error (\(code)): \(message)"
        case .decodingError(let message):
            return "Decoding Error: \(message)"
        case .invalidResponse:
            return "Invalid server response"
        case .unauthorized:
            return "Unauthorized - check your credentials"
        case .notFound(let resource):
            return "Not found: \(resource)"
        case .configurationError(let message):
            return "Configuration Error: \(message)"
        case .unknown:
            return "Unknown error occurred"
        }
    }

    var userMessage: String {
        switch self {
        case .networkError:
            return "Unable to connect to the server. Please check your network connection."
        case .serverError(let code, _):
            if code == 500 {
                return "Server error occurred. Please try again later."
            } else if code == 503 {
                return "Service temporarily unavailable. Please try again later."
            } else {
                return "Server returned an error. Please try again."
            }
        case .decodingError:
            return "Unable to process server response. Please contact support."
        case .invalidResponse:
            return "Received invalid response from server. Please try again."
        case .unauthorized:
            return "Your credentials are invalid. Please check your account settings."
        case .notFound(let resource):
            return "Could not find \(resource). It may have been deleted."
        case .configurationError(let message):
            return message
        case .unknown:
            return "An unexpected error occurred. Please try again."
        }
    }
}
