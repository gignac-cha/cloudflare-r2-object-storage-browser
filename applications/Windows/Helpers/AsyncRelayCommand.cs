using System.Windows.Input;

namespace CloudflareR2Browser.Helpers;

/// <summary>
/// An async command whose sole purpose is to relay its functionality to other objects by invoking delegates.
/// Provides proper task handling for async operations.
/// </summary>
public class AsyncRelayCommand : ICommand
{
    private readonly Func<Task> _execute;
    private readonly Func<bool>? _canExecute;
    private bool _isExecuting;

    /// <summary>
    /// Initializes a new instance of the AsyncRelayCommand class.
    /// </summary>
    /// <param name="execute">The async execution logic</param>
    /// <param name="canExecute">The execution status logic (optional)</param>
    /// <exception cref="ArgumentNullException">Thrown when execute is null</exception>
    public AsyncRelayCommand(Func<Task> execute, Func<bool>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    /// <summary>
    /// Gets a value indicating whether the command is currently executing.
    /// </summary>
    public bool IsExecuting
    {
        get => _isExecuting;
        private set
        {
            if (_isExecuting == value) return;
            _isExecuting = value;
            RaiseCanExecuteChanged();
        }
    }

    /// <summary>
    /// Occurs when changes occur that affect whether or not the command should execute.
    /// </summary>
    public event EventHandler? CanExecuteChanged;

    /// <summary>
    /// Determines whether the command can execute in its current state.
    /// </summary>
    /// <param name="parameter">Data used by the command (ignored in this implementation)</param>
    /// <returns>true if this command can be executed; otherwise, false</returns>
    public bool CanExecute(object? parameter)
    {
        // Don't allow execution while already executing
        if (_isExecuting) return false;
        return _canExecute?.Invoke() ?? true;
    }

    /// <summary>
    /// Executes the async command.
    /// </summary>
    /// <param name="parameter">Data used by the command (ignored in this implementation)</param>
    public async void Execute(object? parameter)
    {
        await ExecuteAsync();
    }

    /// <summary>
    /// Executes the async command and returns the task for proper await handling.
    /// </summary>
    /// <returns>The task representing the async operation</returns>
    public async Task ExecuteAsync()
    {
        if (!CanExecute(null)) return;

        IsExecuting = true;
        try
        {
            await _execute();
        }
        finally
        {
            IsExecuting = false;
        }
    }

    /// <summary>
    /// Raises the CanExecuteChanged event.
    /// </summary>
    public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}

/// <summary>
/// A generic async command whose sole purpose is to relay its functionality to other objects by invoking delegates.
/// Provides proper task handling for async operations.
/// </summary>
/// <typeparam name="T">The type of the command parameter</typeparam>
public class AsyncRelayCommand<T> : ICommand
{
    private readonly Func<T?, Task> _execute;
    private readonly Func<T?, bool>? _canExecute;
    private bool _isExecuting;

    /// <summary>
    /// Initializes a new instance of the AsyncRelayCommand&lt;T&gt; class.
    /// </summary>
    /// <param name="execute">The async execution logic</param>
    /// <param name="canExecute">The execution status logic (optional)</param>
    /// <exception cref="ArgumentNullException">Thrown when execute is null</exception>
    public AsyncRelayCommand(Func<T?, Task> execute, Func<T?, bool>? canExecute = null)
    {
        _execute = execute ?? throw new ArgumentNullException(nameof(execute));
        _canExecute = canExecute;
    }

    /// <summary>
    /// Gets a value indicating whether the command is currently executing.
    /// </summary>
    public bool IsExecuting
    {
        get => _isExecuting;
        private set
        {
            if (_isExecuting == value) return;
            _isExecuting = value;
            RaiseCanExecuteChanged();
        }
    }

    /// <summary>
    /// Occurs when changes occur that affect whether or not the command should execute.
    /// </summary>
    public event EventHandler? CanExecuteChanged;

    /// <summary>
    /// Determines whether the command can execute in its current state.
    /// </summary>
    /// <param name="parameter">Data used by the command</param>
    /// <returns>true if this command can be executed; otherwise, false</returns>
    public bool CanExecute(object? parameter)
    {
        // Don't allow execution while already executing
        if (_isExecuting) return false;
        return _canExecute?.Invoke((T?)parameter) ?? true;
    }

    /// <summary>
    /// Executes the async command.
    /// </summary>
    /// <param name="parameter">Data used by the command</param>
    public async void Execute(object? parameter)
    {
        await ExecuteAsync((T?)parameter);
    }

    /// <summary>
    /// Executes the async command and returns the task for proper await handling.
    /// </summary>
    /// <param name="parameter">Data used by the command</param>
    /// <returns>The task representing the async operation</returns>
    public async Task ExecuteAsync(T? parameter)
    {
        if (!CanExecute(parameter)) return;

        IsExecuting = true;
        try
        {
            await _execute(parameter);
        }
        finally
        {
            IsExecuting = false;
        }
    }

    /// <summary>
    /// Raises the CanExecuteChanged event.
    /// </summary>
    public void RaiseCanExecuteChanged() => CanExecuteChanged?.Invoke(this, EventArgs.Empty);
}
