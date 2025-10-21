using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using CloudflareR2Browser.ViewModels;

namespace CloudflareR2Browser.Views;

/// <summary>
/// Bucket sidebar view displaying the list of R2 buckets.
/// </summary>
public sealed partial class BucketSidebarView : UserControl
{
    /// <summary>
    /// Gets the ViewModel from DataContext.
    /// </summary>
    public BucketSidebarViewModel? ViewModel => DataContext as BucketSidebarViewModel;

    /// <summary>
    /// Initializes a new instance of the BucketSidebarView class.
    /// </summary>
    public BucketSidebarView()
    {
        this.InitializeComponent();

        // Load buckets when DataContext is set
        this.DataContextChanged += async (s, e) =>
        {
            if (ViewModel != null)
            {
                await ViewModel.LoadBucketsAsync();
            }
        };
    }
}
