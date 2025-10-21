using System;
using Microsoft.UI.Xaml.Data;

namespace CloudflareR2Browser.Converters;

/// <summary>
/// Converts a file extension to a Segoe Fluent Icon glyph.
/// </summary>
/// <remarks>
/// Returns appropriate icon glyphs for common file types including images, videos,
/// audio, documents, archives, code files, and folders.
/// </remarks>
public class FileIconConverter : IValueConverter
{
    /// <summary>
    /// Converts a file extension string to a Segoe Fluent Icon glyph.
    /// </summary>
    /// <param name="value">The file extension (with or without leading dot) or path ending with "/".</param>
    /// <param name="targetType">The type of the binding target property.</param>
    /// <param name="parameter">Optional parameter (not used).</param>
    /// <param name="language">The language of the conversion.</param>
    /// <returns>A Unicode character representing the appropriate file icon glyph.</returns>
    public object Convert(object value, Type targetType, object parameter, string language)
    {
        string extension = value as string ?? "";

        // Ensure extension is lowercase for comparison
        extension = extension.ToLowerInvariant();

        // Add leading dot if not present (unless it's a folder)
        if (!extension.StartsWith(".") && extension != "/")
        {
            extension = $".{extension}";
        }

        return extension switch
        {
            // Folders
            "/" => "\uE8B7", // Folder

            // Images
            ".jpg" or ".jpeg" or ".png" or ".gif" or ".webp" or ".bmp" or ".svg" or ".ico" => "\uE91B", // Picture

            // Videos
            ".mp4" or ".mov" or ".avi" or ".mkv" or ".webm" or ".flv" or ".wmv" => "\uE714", // Video

            // Audio
            ".mp3" or ".wav" or ".flac" or ".ogg" or ".m4a" or ".aac" or ".wma" => "\uE8D6", // Music

            // Documents - PDF
            ".pdf" => "\uE8A5", // Document

            // Documents - Word
            ".doc" or ".docx" => "\uE8A5", // Document

            // Documents - Excel
            ".xls" or ".xlsx" or ".csv" => "\uE8A5", // Document

            // Documents - PowerPoint
            ".ppt" or ".pptx" => "\uE8A5", // Document

            // Documents - Text
            ".txt" or ".md" or ".rtf" => "\uE8A5", // Document

            // Archives
            ".zip" or ".rar" or ".7z" or ".tar" or ".gz" or ".bz2" or ".xz" => "\uE8B5", // Zip

            // Code - JavaScript/TypeScript
            ".js" or ".ts" or ".jsx" or ".tsx" or ".mjs" or ".cjs" => "\uE943", // Code

            // Code - Web
            ".html" or ".htm" or ".css" or ".scss" or ".sass" or ".less" => "\uE943", // Code

            // Code - Data formats
            ".json" or ".xml" or ".yaml" or ".yml" or ".toml" => "\uE943", // Code

            // Code - Programming languages
            ".py" or ".java" or ".cpp" or ".c" or ".cs" or ".go" or ".rs" or ".php" or ".rb" or ".swift" => "\uE943", // Code

            // Code - Shell/Config
            ".sh" or ".bash" or ".zsh" or ".fish" or ".ps1" or ".bat" or ".cmd" => "\uE943", // Code

            // Default - Generic document
            _ => "\uE8A5" // Generic document
        };
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
