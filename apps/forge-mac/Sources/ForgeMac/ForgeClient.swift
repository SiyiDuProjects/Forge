import Foundation

struct ForgeClient {
    let baseURL: URL
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    func health() async throws -> ForgeHealthResponse {
        try await get("/api/health")
    }

    func workspaces(limit: Int = 12) async throws -> ForgeWorkspaceListResponse {
        try await get("/api/workspaces?limit=\(limit)")
    }

    func plan(workspaceId: String) async throws -> ForgePlanResponse {
        try await get("/api/workspaces/\(workspaceId.urlPathEncoded)/plan")
    }

    func createPlan(message: String, language: String, runtimeProvider: ForgeRuntimeProvider) async throws -> ForgePlanResponse {
        try await post("/api/plans", body: PlanCreateRequest(
            initialMessage: message,
            language: language,
            runtime: runtimeProvider.rawValue,
            modelProvider: runtimeProvider.rawValue,
            runtimeProvider: runtimeProvider.rawValue
        ))
    }

    func sendTurn(workspaceId: String, sessionId: String, message: String, runtimeProvider: ForgeRuntimeProvider) async throws -> ForgePlanResponse {
        try await post("/api/workspaces/\(workspaceId.urlPathEncoded)/chat/turn", body: ChatTurnRequest(
            sessionId: sessionId,
            userMessage: message,
            runtime: runtimeProvider.rawValue,
            modelProvider: runtimeProvider.rawValue,
            runtimeProvider: runtimeProvider.rawValue,
            mode: "normal"
        ))
    }

    private func get<Response: Decodable>(_ path: String) async throws -> Response {
        var request = URLRequest(url: try endpoint(path))
        request.httpMethod = "GET"
        return try await perform(request)
    }

    private func post<Body: Encodable, Response: Decodable>(_ path: String, body: Body) async throws -> Response {
        var request = URLRequest(url: try endpoint(path))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try encoder.encode(body)
        return try await perform(request)
    }

    private func endpoint(_ path: String) throws -> URL {
        let root = baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: "\(root)\(path)") else {
            throw ForgeClientError.invalidURL(path)
        }
        return url
    }

    private func perform<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw ForgeClientError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let message = String(data: data, encoding: .utf8) ?? "HTTP \(http.statusCode)"
            throw ForgeClientError.http(status: http.statusCode, message: message)
        }
        return try decoder.decode(Response.self, from: data)
    }
}

private struct PlanCreateRequest: Encodable {
    let initialMessage: String
    let language: String
    let runtime: String
    let modelProvider: String
    let runtimeProvider: String
}

private struct ChatTurnRequest: Encodable {
    let sessionId: String
    let userMessage: String
    let runtime: String
    let modelProvider: String
    let runtimeProvider: String
    let mode: String
}

enum ForgeClientError: LocalizedError {
    case invalidURL(String)
    case invalidResponse
    case http(status: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidURL(let path):
            "Invalid Forge API URL: \(path)"
        case .invalidResponse:
            "Forge server returned an invalid response."
        case .http(let status, let message):
            "Forge API error \(status): \(message)"
        }
    }
}

private extension String {
    var urlPathEncoded: String {
        addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? self
    }
}
