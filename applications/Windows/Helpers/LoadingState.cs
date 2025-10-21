using System;

namespace CloudflareR2Browser.Helpers;

/// <summary>
/// Represents the loading state of an asynchronous operation with type-safe state handling.
/// Uses discriminated union pattern for state management.
/// </summary>
/// <typeparam name="T">The type of data being loaded</typeparam>
public abstract record LoadingState<T>
{
    /// <summary>
    /// Represents the idle state before any loading has started.
    /// </summary>
    public record Idle : LoadingState<T>;

    /// <summary>
    /// Represents the loading state while data is being fetched.
    /// </summary>
    public record Loading : LoadingState<T>;

    /// <summary>
    /// Represents the loaded state with successfully fetched data.
    /// </summary>
    /// <param name="Data">The successfully loaded data</param>
    public record Loaded(T Data) : LoadingState<T>;

    /// <summary>
    /// Represents the failed state with error information.
    /// </summary>
    public record Failed : LoadingState<T>
    {
        /// <summary>
        /// Gets the exception that caused the failure.
        /// </summary>
        public Exception Error { get; init; }

        /// <summary>
        /// Initializes a new instance of the Failed state.
        /// </summary>
        /// <param name="error">The exception that caused the failure</param>
        public Failed(Exception error)
        {
            Error = error;
        }
    }

    /// <summary>
    /// Gets a value indicating whether the state is idle.
    /// </summary>
    public bool IsIdle => this is Idle;

    /// <summary>
    /// Gets a value indicating whether the state is loading.
    /// </summary>
    public bool IsLoading => this is Loading;

    /// <summary>
    /// Gets a value indicating whether the state is loaded with data.
    /// </summary>
    public bool IsLoaded => this is Loaded;

    /// <summary>
    /// Gets a value indicating whether the state is failed with an error.
    /// </summary>
    public bool IsFailed => this is Failed;

    /// <summary>
    /// Gets the loaded value if in Loaded state, otherwise returns default value.
    /// </summary>
    public T? Value => this is Loaded loaded ? loaded.Data : default;

    /// <summary>
    /// Gets the error if in Failed state, otherwise returns null.
    /// </summary>
    public Exception? Error => this is Failed failed ? failed.Error : null;

    /// <summary>
    /// Gets the error message if in Failed state, otherwise returns null.
    /// </summary>
    public string? ErrorMessage => Error?.Message;
}
