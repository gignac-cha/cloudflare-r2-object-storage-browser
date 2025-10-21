#nullable enable

using System;
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
/// ViewModel for the bucket sidebar.
/// Manages bucket list display and selection.
/// </summary>
public sealed class BucketSidebarViewModel : ObservableObject
{
    private readonly ILogger<BucketSidebarViewModel> _logger;
    private readonly R2ApiClient _apiClient;
    private readonly FolderCache _cache;

    private LoadingState<List<Bucket>> _loadingState = new LoadingState<List<Bucket>>.Idle();
    private Bucket? _selectedBucket;

    /// <summary>
    /// Event raised when a bucket is selected.
    /// </summary>
    public event EventHandler<Bucket>? BucketSelected;

    /// <summary>
    /// Initializes a new instance of the BucketSidebarViewModel class.
    /// </summary>
    /// <param name="logger">Logger instance.</param>
    /// <param name="apiClient">R2 API client.</param>
    /// <param name="cache">Folder cache.</param>
    public BucketSidebarViewModel(
        ILogger<BucketSidebarViewModel> logger,
        R2ApiClient apiClient,
        FolderCache cache)
    {
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _apiClient = apiClient ?? throw new ArgumentNullException(nameof(apiClient));
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));

        // Initialize commands
        RefreshCommand = new AsyncRelayCommand(LoadBucketsAsync);
        SelectBucketCommand = new RelayCommand<Bucket>(SelectBucket);

        _logger.LogInformation("BucketSidebarViewModel initialized");
    }

    // ========================================================================
    // Properties
    // ========================================================================

    /// <summary>
    /// Gets the collection of buckets.
    /// </summary>
    public ObservableCollection<Bucket> Buckets { get; } = new();

    /// <summary>
    /// Gets or sets the loading state for buckets.
    /// </summary>
    public LoadingState<List<Bucket>> LoadingState
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
    /// Gets whether buckets are currently loading.
    /// </summary>
    public bool IsLoading => LoadingState.IsLoading;

    /// <summary>
    /// Gets the error message if loading failed.
    /// </summary>
    public string? Error => LoadingState.ErrorMessage;

    /// <summary>
    /// Gets or sets the selected bucket.
    /// </summary>
    public Bucket? SelectedBucket
    {
        get => _selectedBucket;
        set
        {
            if (SetProperty(ref _selectedBucket, value) && value != null)
            {
                _logger.LogInformation("Bucket selected: {BucketName}", value.Name);
                BucketSelected?.Invoke(this, value);
            }
        }
    }

    // ========================================================================
    // Commands
    // ========================================================================

    /// <summary>
    /// Command to refresh the bucket list.
    /// </summary>
    public ICommand RefreshCommand { get; }

    /// <summary>
    /// Command to select a bucket.
    /// </summary>
    public ICommand SelectBucketCommand { get; }

    // ========================================================================
    // Public Methods
    // ========================================================================

    /// <summary>
    /// Loads the list of buckets from R2.
    /// </summary>
    public async Task LoadBucketsAsync()
    {
        _logger.LogInformation("Loading buckets...");
        LoadingState = new LoadingState<List<Bucket>>.Loading();

        try
        {
            var buckets = await _apiClient.ListBucketsAsync();

            // Sort buckets alphabetically
            var sortedBuckets = buckets.OrderBy(b => b.Name).ToList();

            LoadingState = new LoadingState<List<Bucket>>.Loaded(sortedBuckets);

            // Update observable collection
            Buckets.Clear();
            foreach (var bucket in sortedBuckets)
            {
                Buckets.Add(bucket);
            }

            _logger.LogInformation("Loaded {Count} buckets", buckets.Count);
        }
        catch (R2ApiException ex)
        {
            _logger.LogError(ex, "Failed to load buckets");
            LoadingState = new LoadingState<List<Bucket>>.Failed(ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error loading buckets");
            LoadingState = new LoadingState<List<Bucket>>.Failed(ex);
        }
    }

    /// <summary>
    /// Selects a specific bucket.
    /// </summary>
    /// <param name="bucket">The bucket to select.</param>
    public void SelectBucket(Bucket? bucket)
    {
        if (bucket == null)
        {
            _logger.LogWarning("Attempted to select null bucket");
            return;
        }

        SelectedBucket = bucket;
    }

    /// <summary>
    /// Clears the current bucket selection.
    /// </summary>
    public void ClearSelection()
    {
        SelectedBucket = null;
        _logger.LogDebug("Bucket selection cleared");
    }

    /// <summary>
    /// Refreshes the cache for a specific bucket.
    /// </summary>
    /// <param name="bucketName">The bucket name to refresh.</param>
    public void InvalidateBucketCache(string bucketName)
    {
        if (string.IsNullOrEmpty(bucketName))
        {
            return;
        }

        var count = _cache.InvalidateBucket(bucketName);
        _logger.LogInformation("Invalidated {Count} cache entries for bucket '{Bucket}'", count, bucketName);
    }

    /// <summary>
    /// Gets the bucket by name.
    /// </summary>
    /// <param name="bucketName">The bucket name.</param>
    /// <returns>The bucket if found, null otherwise.</returns>
    public Bucket? GetBucketByName(string bucketName)
    {
        return Buckets.FirstOrDefault(b => b.Name.Equals(bucketName, StringComparison.OrdinalIgnoreCase));
    }
}
