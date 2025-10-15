import Foundation

/// API client for communicating with the local Fastify server
@MainActor
class APIClient: ObservableObject {
    @Published var serverPort: Int?

    private let session: URLSession

    init(serverPort: Int? = nil) {
        self.serverPort = serverPort

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }

    // MARK: - Base URL

    private var baseURL: URL? {
        guard let port = serverPort else { return nil }
        return URL(string: "http://127.0.0.1:\(port)")
    }

    // MARK: - Generic Request Method

    private func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: Data? = nil
    ) async throws -> T {
        guard let baseURL = baseURL else {
            throw R2Error.configurationError("Server port not available")
        }

        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw R2Error.configurationError("Invalid endpoint: \(endpoint)")
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let body = body {
            request.httpBody = body
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw R2Error.invalidResponse
            }

            // Check status code
            switch httpResponse.statusCode {
            case 200...299:
                break
            case 401:
                throw R2Error.unauthorized
            case 404:
                throw R2Error.notFound(endpoint)
            case 500...599:
                throw R2Error.serverError(httpResponse.statusCode, "Server error")
            default:
                throw R2Error.serverError(httpResponse.statusCode, "Unexpected status code")
            }

            // Decode response
            let decoder = JSONDecoder()
            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                throw R2Error.decodingError(error.localizedDescription)
            }

        } catch let error as R2Error {
            throw error
        } catch {
            throw R2Error.networkError(error.localizedDescription)
        }
    }

    // MARK: - Bucket Operations

    /// List all buckets
    func listBuckets() async throws -> [Bucket] {
        let response: BucketsResponse = try await request(endpoint: "/buckets")
        return response.data.buckets
    }

    // MARK: - Object Operations

    /// List objects in a bucket with optional prefix
    func listObjects(
        bucket: String,
        prefix: String? = nil,
        delimiter: String = "/",
        maxKeys: Int = 1000,
        continuationToken: String? = nil
    ) async throws -> ObjectsResponse {
        var components = URLComponents(string: "/buckets/\(bucket)/objects")!
        var queryItems: [URLQueryItem] = []

        if let prefix = prefix {
            queryItems.append(URLQueryItem(name: "prefix", value: prefix))
        }
        queryItems.append(URLQueryItem(name: "delimiter", value: delimiter))
        queryItems.append(URLQueryItem(name: "maxKeys", value: "\(maxKeys)"))

        if let token = continuationToken {
            queryItems.append(URLQueryItem(name: "continuationToken", value: token))
        }

        components.queryItems = queryItems

        return try await request(endpoint: components.url!.path + "?" + (components.query ?? ""))
    }

    /// Download an object
    func downloadObject(bucket: String, key: String) async throws -> (Data, HTTPURLResponse) {
        guard let baseURL = baseURL else {
            throw R2Error.configurationError("Server port not available")
        }

        let encodedKey = key.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? key
        let endpoint = "/buckets/\(bucket)/objects/\(encodedKey)"

        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw R2Error.configurationError("Invalid endpoint")
        }

        let (data, response) = try await session.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw R2Error.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw R2Error.serverError(httpResponse.statusCode, "Download failed")
        }

        return (data, httpResponse)
    }

    /// Upload an object
    func uploadObject(bucket: String, key: String, data: Data) async throws -> ObjectUploadResponse {
        guard let baseURL = baseURL else {
            throw R2Error.configurationError("Server port not available")
        }

        let encodedKey = key.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? key
        let endpoint = "/buckets/\(bucket)/objects/\(encodedKey)"

        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw R2Error.configurationError("Invalid endpoint")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "PUT"
        request.httpBody = data
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("\(data.count)", forHTTPHeaderField: "Content-Length")

        let (responseData, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw R2Error.invalidResponse
        }

        guard httpResponse.statusCode == 200 || httpResponse.statusCode == 201 else {
            throw R2Error.serverError(httpResponse.statusCode, "Upload failed")
        }

        let decoder = JSONDecoder()
        return try decoder.decode(ObjectUploadResponse.self, from: responseData)
    }

    /// Delete an object
    func deleteObject(bucket: String, key: String) async throws -> ObjectDeleteResponse {
        let encodedKey = key.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? key
        let endpoint = "/buckets/\(bucket)/objects/\(encodedKey)"

        guard let baseURL = baseURL else {
            throw R2Error.configurationError("Server port not available")
        }

        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw R2Error.configurationError("Invalid endpoint")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw R2Error.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw R2Error.serverError(httpResponse.statusCode, "Delete failed")
        }

        let decoder = JSONDecoder()
        return try decoder.decode(ObjectDeleteResponse.self, from: data)
    }

    /// Delete multiple objects using batch API (up to 1000 per request)
    func deleteBatch(bucket: String, keys: [String]) async throws {
        guard let baseURL = baseURL else {
            throw R2Error.configurationError("Server port not available")
        }

        let endpoint = "/buckets/\(bucket)/objects/batch"
        guard let url = URL(string: endpoint, relativeTo: baseURL) else {
            throw R2Error.configurationError("Invalid endpoint")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["keys": keys]
        request.httpBody = try JSONEncoder().encode(body)

        let (_, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw R2Error.invalidResponse
        }

        guard httpResponse.statusCode == 200 else {
            throw R2Error.serverError(httpResponse.statusCode, "Batch delete failed")
        }
    }

    /// Delete multiple objects (uses batch API with progress tracking)
    func deleteObjects(
        bucket: String,
        keys: [String],
        onProgress: ((Int, Int) -> Void)? = nil
    ) async throws {
        // Use batch API for efficiency (max 1000 per request)
        let batchSize = 1000
        let totalCount = keys.count
        var deletedCount = 0

        for i in stride(from: 0, to: keys.count, by: batchSize) {
            let end = min(i + batchSize, keys.count)
            let batch = Array(keys[i..<end])
            try await deleteBatch(bucket: bucket, keys: batch)

            deletedCount += batch.count
            onProgress?(deletedCount, totalCount)
        }
    }

    /// Delete a folder (prefix) and all its contents using batch API
    /// Returns the number of objects deleted
    @discardableResult
    func deleteFolder(
        bucket: String,
        prefix: String,
        onProgress: ((Int, Int) -> Void)? = nil
    ) async throws -> Int {
        // First, list all objects with this prefix (no delimiter to get all nested objects)
        let response = try await listObjects(
            bucket: bucket,
            prefix: prefix,
            delimiter: "",
            maxKeys: 1000
        )

        // Collect all object keys
        var keysToDelete = response.data.map { $0.key }

        // If there are more objects (paginated), continue fetching
        var continuationToken = response.pagination.continuationToken
        while continuationToken != nil {
            let nextResponse = try await listObjects(
                bucket: bucket,
                prefix: prefix,
                delimiter: "",
                maxKeys: 1000,
                continuationToken: continuationToken
            )
            keysToDelete.append(contentsOf: nextResponse.data.map { $0.key })
            continuationToken = nextResponse.pagination.continuationToken
        }

        // Delete all objects in batches with progress callback
        let totalCount = keysToDelete.count
        if !keysToDelete.isEmpty {
            let batchSize = 1000
            var deletedCount = 0

            for i in stride(from: 0, to: keysToDelete.count, by: batchSize) {
                let end = min(i + batchSize, keysToDelete.count)
                let batch = Array(keysToDelete[i..<end])

                // Delete batch
                try await deleteBatch(bucket: bucket, keys: batch)

                // Update progress
                deletedCount += batch.count
                onProgress?(deletedCount, totalCount)
            }
        }

        return totalCount
    }

    // MARK: - Search

    /// Search for objects by name
    func searchObjects(bucket: String, query: String) async throws -> [R2Object] {
        var components = URLComponents(string: "/buckets/\(bucket)/search")!
        components.queryItems = [URLQueryItem(name: "q", value: query)]

        let response: ObjectsResponse = try await request(endpoint: components.url!.path + "?" + (components.query ?? ""))
        return response.data
    }
}
