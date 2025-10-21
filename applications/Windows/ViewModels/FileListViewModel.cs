#nullable enable

using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Input;
using CloudflareR2Browser.Helpers;
using CloudflareR2Browser.Models;
using CloudflareR2Browser.Services;
using Microsoft.Extensions.Logging;

namespace CloudflareR2Browser.ViewModels;

/// <summary>
/// ViewModel for the file list view.
/// Manages file browsing, navigation, and operations.
/// </summary>
public sealed class FileListViewModel : ObservableObject
{
    private readonly ILogger<FileListViewModel> _logger;
    private readonly R2ApiClient _apiClient;
    private readonly FolderCache _cache;

    private string? _currentBucket;
    private string _currentPath = "";
    private LoadingState<List<R2Object>> _loadingState = new LoadingState<List<R2Object>>.Idle();
    private string _sortColumn = "Name";
    private bool _sortAscending = true;

    private readonly Stack<string> _navigationHistory = new();
    private readonly Stack<string> _forwardHistory = new();

    /// <summary>
    /// Event raised when objects are selected (for preview).
    /// </summary>
    public event EventHandler<R2Object>? ObjectPreviewRequested;

    /// <summary>
    /// Initializes a new instance of the FileListViewModel class.
    /// </summary>
    /// <param name="logger">Logger instance.</param>
    /// <param name="apiClient">R2 API client.</param>
    /// <param name="cache">Folder cache.</param>
    public FileListViewModel(
        ILogger<FileListViewModel> logger,
        R2ApiClient apiClient,
        FolderCache cache)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _apiClient = apiClient ?? throw new ArgumentNullException(nameof(apiClient));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));

        // Initialize commands
        LoadObjectsCommand = new AsyncRelayCommand(LoadObjectsAsync, () => !string.IsNullOrEmpty(_currentBucket));
        OpenFolderCommand = new AsyncRelayCommand<string>(OpenFolderAsync);
        NavigateBackCommand = new RelayCommand(NavigateBack, () => CanGoBack);
        NavigateForwardCommand = new RelayCommand(NavigateForward, () => CanGoForward);
        NavigateUpCommand = new RelayCommand(NavigateUp, () => CanGoUp);
        RefreshCommand = new AsyncRelayCommand(RefreshAsync);
        PreviewCommand = new RelayCommand<R2Object>(PreviewObject);

        _logger.LogInformation("FileListViewModel initialized");
    }

    // ========================================================================
    // Properties
    // ========================================================================

    /// <summary>
    /// Gets the collection of objects in the current folder.
    /// </summary>
    public ObservableCollection<R2Object> Objects { get; } = new();

    /// <summary>
    /// Gets the collection of folders in the current folder.
    /// </summary>
    public ObservableCollection<string> Folders { get; } = new();

    /// <summary>
    /// Gets the collection of selected objects.
    /// </summary>
    public ObservableCollection<R2Object> SelectedObjects { get; } = new();

    /// <summary>
    /// Gets the current bucket name.
    /// </summary>
    public string? CurrentBucket
    {
        get => _currentBucket;
        private set => SetProperty(ref _currentBucket, value);
    }

    /// <summary>
    /// Gets the current path within the bucket.
    /// </summary>
    public string CurrentPath
    {
        get => _currentPath;
        private set
        {
            if (SetProperty(ref _currentPath, value))
            {
                OnPropertyChanged(nameof(CanGoUp));
                OnPropertyChanged(nameof(BreadcrumbParts));
            }
        }
    }

    /// <summary>
    /// Gets the breadcrumb parts for the current path.
    /// </summary>
    public List<string> BreadcrumbParts
    {
        get
        {
            if (string.IsNullOrEmpty(CurrentPath))
            {
                return new List<string>();
            }

            return CurrentPath.Split('/', StringSplitOptions.RemoveEmptyEntries).ToList();
        }
    }

    /// <summary>
    /// Gets or sets the loading state.
    /// </summary>
    public LoadingState<List<R2Object>> LoadingState
    {
        get => _loadingState;
        private set
        {
            if (SetProperty(ref _loadingState, value))
            {
                OnPropertyChanged(nameof(IsLoading));
                OnPropertyChanged(nameof(Error));
            }
        }
    }

    /// <summary>
    /// Gets whether objects are currently loading.
    /// </summary>
    public bool IsLoading => LoadingState.IsLoading;

    /// <summary>
    /// Gets the error message if loading failed.
    /// </summary>
    public string? Error => LoadingState.ErrorMessage;

    /// <summary>
    /// Gets whether the user can navigate back.
    /// </summary>
    public bool CanGoBack => _navigationHistory.Count > 0;

    /// <summary>
    /// Gets whether the user can navigate forward.
    /// </summary>
    public bool CanGoForward => _forwardHistory.Count > 0;

    /// <summary>
    /// Gets whether the user can navigate up.
    /// </summary>
    public bool CanGoUp => !string.IsNullOrEmpty(CurrentPath);

    /// <summary>
    /// Gets or sets the current sort column.
    /// </summary>
    public string SortColumn
    {
        get => _sortColumn;
        set => SetProperty(ref _sortColumn, value);
    }

    /// <summary>
    /// Gets or sets the sort direction (true = ascending, false = descending).
    /// </summary>
    public bool SortAscending
    {
        get => _sortAscending;
        set => SetProperty(ref _sortAscending, value);
    }

    // ========================================================================
    // Commands
    // ========================================================================

    /// <summary>
    /// Command to load objects in the current bucket/path.
    /// </summary>
    public ICommand LoadObjectsCommand { get; }

    /// <summary>
    /// Command to open a folder.
    /// </summary>
    public ICommand OpenFolderCommand { get; }

    /// <summary>
    /// Command to navigate back in history.
    /// </summary>
    public ICommand NavigateBackCommand { get; }

    /// <summary>
    /// Command to navigate forward in history.
    /// </summary>
    public ICommand NavigateForwardCommand { get; }

    /// <summary>
    /// Command to navigate up one level.
    /// </summary>
    public ICommand NavigateUpCommand { get; }

    /// <summary>
    /// Command to refresh the current view.
    /// </summary>
    public ICommand RefreshCommand { get; }

    /// <summary>
    /// Command to preview an object.
    /// </summary>
    public ICommand PreviewCommand { get; }

    // ========================================================================
    // Public Methods
    // ========================================================================

    /// <summary>
    /// Sets the current bucket and loads objects.
    /// </summary>
    /// <param name="bucketName">The bucket name.</param>
    public async Task SetBucketAsync(string bucketName)
    {
        if (string.IsNullOrEmpty(bucketName))
        {
            _logger.LogWarning("Attempted to set empty bucket name");
            return;
        }

        _logger.LogInformation("Setting bucket to: {BucketName}", bucketName);

        CurrentBucket = bucketName;
        CurrentPath = "";
        _navigationHistory.Clear();
        _forwardHistory.Clear();

        await LoadObjectsAsync();
    }

    /// <summary>
    /// Loads objects in the current bucket and path.
    /// </summary>
    public async Task LoadObjectsAsync()
    {
        if (string.IsNullOrEmpty(CurrentBucket))
        {
            _logger.LogWarning("Cannot load objects: no bucket selected");
            return;
        }

        _logger.LogInformation("Loading objects: {Bucket}/{Path}", CurrentBucket, CurrentPath);
        LoadingState = new LoadingState<List<R2Object>>.Loading();

        try
        {
            // Check cache first
            var cached = _cache.Get(CurrentBucket, CurrentPath);
            if (cached != null && cached.IsFresh)
            {
                _logger.LogDebug("Using fresh cached data");
                UpdateCollections(cached.Objects, cached.Folders);
                LoadingState = new LoadingState<List<R2Object>>.Loaded(cached.Objects);
                return;
            }

            // Fetch from API
            var response = await _apiClient.ListObjectsAsync(
                CurrentBucket,
                prefix: CurrentPath,
                delimiter: "/",
                maxKeys: 1000);

            var objects = response.Objects;
            var folders = response.CommonPrefixes;

            // Update cache
            _cache.Set(CurrentBucket, CurrentPath, objects, folders);

            // Sort objects
            objects = SortObjects(objects).ToList();

            // Update UI
            UpdateCollections(objects, folders);
            LoadingState = new LoadingState<List<R2Object>>.Loaded(objects);

            _logger.LogInformation("Loaded {ObjectCount} objects and {FolderCount} folders",
                objects.Count, folders.Count);
        }
        catch (R2ApiException ex)
        {
            _logger.LogError(ex, "Failed to load objects");
            LoadingState = new LoadingState<List<R2Object>>.Failed(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error loading objects");
            LoadingState = new LoadingState<List<R2Object>>.Failed(ex);
        }
    }

    /// <summary>
    /// Opens a folder and loads its contents.
    /// </summary>
    /// <param name="folderPath">The folder path to open.</param>
    public async Task OpenFolderAsync(string? folderPath)
    {
        if (string.IsNullOrEmpty(folderPath))
        {
            return;
        }

        _logger.LogInformation("Opening folder: {Folder}", folderPath);

        // Add current path to history
        if (!string.IsNullOrEmpty(CurrentPath) || !string.IsNullOrEmpty(folderPath))
        {
            _navigationHistory.Push(CurrentPath);
            _forwardHistory.Clear();
            OnPropertyChanged(nameof(CanGoBack));
            OnPropertyChanged(nameof(CanGoForward));
        }

        CurrentPath = folderPath;
        await LoadObjectsAsync();
    }

    /// <summary>
    /// Navigates to a specific path.
    /// </summary>
    /// <param name="path">The path to navigate to.</param>
    public async Task NavigateToPathAsync(string path)
    {
        _logger.LogInformation("Navigating to path: {Path}", path);

        if (!string.Equals(CurrentPath, path, StringComparison.Ordinal))
        {
            _navigationHistory.Push(CurrentPath);
            _forwardHistory.Clear();
            OnPropertyChanged(nameof(CanGoBack));
            OnPropertyChanged(nameof(CanGoForward));
        }

        CurrentPath = path ?? "";
        await LoadObjectsAsync();
    }

    /// <summary>
    /// Navigates back in the navigation history.
    /// </summary>
    public void NavigateBack()
    {
        if (!CanGoBack)
        {
            return;
        }

        _logger.LogDebug("Navigating back");

        _forwardHistory.Push(CurrentPath);
        var previousPath = _navigationHistory.Pop();
        CurrentPath = previousPath;

        OnPropertyChanged(nameof(CanGoBack));
        OnPropertyChanged(nameof(CanGoForward));

        _ = LoadObjectsAsync();
    }

    /// <summary>
    /// Navigates forward in the navigation history.
    /// </summary>
    public void NavigateForward()
    {
        if (!CanGoForward)
        {
            return;
        }

        _logger.LogDebug("Navigating forward");

        _navigationHistory.Push(CurrentPath);
        var nextPath = _forwardHistory.Pop();
        CurrentPath = nextPath;

        OnPropertyChanged(nameof(CanGoBack));
        OnPropertyChanged(nameof(CanGoForward));

        _ = LoadObjectsAsync();
    }

    /// <summary>
    /// Navigates up one level in the folder hierarchy.
    /// </summary>
    public void NavigateUp()
    {
        if (!CanGoUp)
        {
            return;
        }

        _logger.LogDebug("Navigating up");

        var parts = CurrentPath.TrimEnd('/').Split('/');
        var parentPath = parts.Length > 1
            ? string.Join('/', parts[..^1]) + "/"
            : "";

        _navigationHistory.Push(CurrentPath);
        _forwardHistory.Clear();
        CurrentPath = parentPath;

        OnPropertyChanged(nameof(CanGoBack));
        OnPropertyChanged(nameof(CanGoForward));

        _ = LoadObjectsAsync();
    }

    /// <summary>
    /// Refreshes the current view.
    /// </summary>
    public async Task RefreshAsync()
    {
        if (string.IsNullOrEmpty(CurrentBucket))
        {
            return;
        }

        _logger.LogInformation("Refreshing view");

        // Invalidate cache for current path
        _cache.InvalidatePrefix(CurrentBucket, CurrentPath);

        await LoadObjectsAsync();
    }

    /// <summary>
    /// Sorts the objects by the specified column and direction.
    /// </summary>
    /// <param name="column">Column name to sort by.</param>
    /// <param name="ascending">Sort direction.</param>
    public void Sort(string column, bool ascending)
    {
        SortColumn = column;
        SortAscending = ascending;

        _logger.LogDebug("Sorting by {Column} ({Direction})", column, ascending ? "asc" : "desc");

        var sorted = SortObjects(Objects.ToList());
        Objects.Clear();
        foreach (var obj in sorted)
        {
            Objects.Add(obj);
        }
    }

    /// <summary>
    /// Previews an object.
    /// </summary>
    /// <param name="obj">The object to preview.</param>
    public void PreviewObject(R2Object? obj)
    {
        if (obj == null || obj.IsFolder)
        {
            return;
        }

        _logger.LogInformation("Preview requested for: {Key}", obj.Key);
        ObjectPreviewRequested?.Invoke(this, obj);
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /// <summary>
    /// Updates the Objects and Folders collections.
    /// </summary>
    private void UpdateCollections(List<R2Object> objects, List<string> folders)
    {
        Objects.Clear();
        Folders.Clear();

        foreach (var folder in folders.OrderBy(f => f))
        {
            Folders.Add(folder);
        }

        foreach (var obj in objects)
        {
            Objects.Add(obj);
        }
    }

    /// <summary>
    /// Sorts objects based on current sort column and direction.
    /// </summary>
    private IEnumerable<R2Object> SortObjects(List<R2Object> objects)
    {
        IOrderedEnumerable<R2Object> sorted = SortColumn switch
        {
            "Name" => SortAscending
                ? objects.OrderBy(o => o.Name)
                : objects.OrderByDescending(o => o.Name),
            "Size" => SortAscending
                ? objects.OrderBy(o => o.Size)
                : objects.OrderByDescending(o => o.Size),
            "Modified" => SortAscending
                ? objects.OrderBy(o => o.LastModifiedDateTime)
                : objects.OrderByDescending(o => o.LastModifiedDateTime),
            "Type" => SortAscending
                ? objects.OrderBy(o => o.Extension)
                : objects.OrderByDescending(o => o.Extension),
            _ => SortAscending
                ? objects.OrderBy(o => o.Name)
                : objects.OrderByDescending(o => o.Name)
        };

        return sorted;
    }
}
