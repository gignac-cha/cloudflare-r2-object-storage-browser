using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Data;

namespace CloudflareR2Browser.Converters;

/// <summary>
/// Converts a boolean value to a Visibility value.
/// </summary>
/// <remarks>
/// By default, true maps to Visible and false maps to Collapsed.
/// Set Invert to true to reverse this behavior.
/// </remarks>
public class BoolToVisibilityConverter : IValueConverter
{
    /// <summary>
    /// Gets or sets whether to invert the conversion logic.
    /// </summary>
    public bool Invert { get; set; }

    /// <summary>
    /// Converts a boolean value to a Visibility value.
    /// </summary>
    /// <param name="value">The boolean value to convert.</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>Visibility.Visible if the boolean is true (or false if Inverted), otherwise Visibility.Collapsed.</returns>
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        if (value is bool boolValue)
        {
            bool result = Invert ? !boolValue : boolValue;
            return result ? Visibility.Visible : Visibility.Collapsed;
        }
        return Visibility.Collapsed;
    }

    /// <summary>
    /// Converts a Visibility value back to a boolean value.
    /// </summary>
    /// <param name="value">The Visibility value to convert.</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>True if Visibility is Visible (respecting Invert setting), otherwise false.</returns>
    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        if (value is Visibility visibility)
        {
            bool result = visibility == Visibility.Visible;
            return Invert ? !result : result;
        }
        return false;
    }
}
