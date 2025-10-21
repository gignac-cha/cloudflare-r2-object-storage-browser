namespace CloudflareR2Browser.Models;

/// <summary>
/// Server state enumeration representing the lifecycle of the API server.
/// </summary>
public enum ServerState
{
    /// <summary>
    /// Server is stopped and not running.
    /// </summary>
    Stopped,

    /// <summary>
    /// Server is in the process of starting up.
    /// </summary>
    Starting,

    /// <summary>
    /// Server is running and accepting requests.
    /// </summary>
    Running,

    /// <summary>
    /// Server is in the process of shutting down.
    /// </summary>
    Stopping,

    /// <summary>
    /// Server encountered an error and cannot start or continue running.
    /// </summary>
    Error
}
