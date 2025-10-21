using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Data;

namespace CloudflareR2Browser.Converters;

/// <summary>
/// Converts a null value to a Visibility value.
/// </summary>
/// <remarks>
/// By default, null maps to Visible and non-null maps to Collapsed.
/// Set Invert to true to reverse this behavior (non-null = Visible, null = Collapsed).
/// </remarks>
public class NullToVisibilityConverter : IValueConverter
{
    /// <summary>
    /// Gets or sets whether to invert the conversion logic.
    /// </summary>
    public bool Invert { get; set; }

    /// <summary>
    /// Converts a value to Visibility based on whether it is null.
    /// </summary>
    /// <param name="value">The value to check for null.</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>Visibility.Visible if the value is null (or non-null if Inverted), otherwise Visibility.Collapsed.</returns>
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        bool isNull = value == null;
        bool result = Invert ? !isNull : isNull;
        return result ? Visibility.Visible : Visibility.Collapsed;
    }

    /// <summary>
    /// ConvertBack is not supported for this converter.
    /// </summary>
    /// <exception cref="NotImplementedException">This converter does not support two-way binding.</exception>
    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        throw new NotImplementedException();
    }
}
