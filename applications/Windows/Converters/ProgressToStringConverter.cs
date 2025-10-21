using System;
using Microsoft.UI.Xaml.Data;

namespace CloudflareR2Browser.Converters;

/// <summary>
/// Converts a progress value (0-1) to a percentage string.
/// </summary>
/// <remarks>
/// Converts decimal progress values like 0.75 to "75%".
/// Handles double and float input types.
/// </remarks>
public class ProgressToStringConverter : IValueConverter
{
    /// <summary>
    /// Converts a progress value (0-1) to a percentage string.
    /// </summary>
    /// <param name="value">The progress value as a double or float (0-1).</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>A percentage string like "75%" or "0%" if invalid.</returns>
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        double progress = value switch
        {
            double doubleValue => doubleValue,
            float floatValue => floatValue,
            _ => 0
        };

        // Clamp to 0-1 range
        progress = Math.Clamp(progress, 0, 1);

        // Convert to percentage (0-100)
        int percentage = (int)Math.Round(progress * 100);

        return $"{percentage}%";
    }

    /// <summary>
    /// Converts a percentage string back to a progress value (0-1).
    /// </summary>
    /// <param name="value">The percentage string (e.g., "75%").</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>A progress value between 0 and 1.</returns>
    public object ConvertBack(object value, Type targetType, object parameter, string language)
    {
        if (value is string stringValue)
        {
            // Remove the % sign if present
            stringValue = stringValue.Replace("%", "").Trim();

            if (double.TryParse(stringValue, out double percentage))
            {
                // Convert from percentage (0-100) to progress (0-1)
                return Math.Clamp(percentage / 100.0, 0, 1);
            }
        }

        return 0.0;
    }
}
