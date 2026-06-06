import Foundation
import SwiftUI

@MainActor
final class ForgeAppState: ObservableObject {
    @Published var endpointString: String {
        didSet { UserDefaults.standard.set(endpointString, forKey: "forgeMac.endpoint") }
    }
    @Published var runtimeProvider: ForgeRuntimeProvider {
        didSet { UserDefaults.standard.set(runtimeProvider.rawValue, forKey: "forgeMac.runtimeProvider") }
    }
    @Published var language: String {
        didSet { UserDefaults.standard.set(language, forKey: "forgeMac.language") }
    }
    @Published var workspaces: [ForgeWorkspaceSummary] = []
    @Published var selectedWorkspaceId: String?
    @Published var productPlan: ForgeProductPlan?
    @Published var prompt: String = ""
    @Published var isLoading = false
    @Published var connectionMessage = "未连接"
    @Published var errorMessage = ""
    @Published var showingSettings = false

    init() {
        endpointString = UserDefaults.standard.string(forKey: "forgeMac.endpoint") ?? "http://127.0.0.1:8765"
        runtimeProvider = ForgeRuntimeProvider(rawValue: UserDefaults.standard.string(forKey: "forgeMac.runtimeProvider") ?? "") ?? .codex
        language = UserDefaults.standard.string(forKey: "forgeMac.language") ?? "zh"
    }

    var client: ForgeClient? {
        guard let url = URL(string: endpointString.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            return nil
        }
        return ForgeClient(baseURL: url)
    }

    var selectedWorkspace: ForgeWorkspaceSummary? {
        workspaces.first(where: { $0.id == selectedWorkspaceId })
    }

    var activeSessionId: String {
        "session_\(productPlan?.planId ?? selectedWorkspaceId ?? "draft")"
    }

    var previewURL: URL? {
        guard let root = URL(string: endpointString.trimmingCharacters(in: .whitespacesAndNewlines)) else {
            return nil
        }
        var components = URLComponents(url: root, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "macClient", value: "1"),
            URLQueryItem(name: "workspaceId", value: productPlan?.planId ?? selectedWorkspaceId ?? "")
        ]
        return components?.url
    }

    func bootstrap() async {
        await checkConnection()
        await refreshWorkspaces(selectFirst: true)
    }

    func checkConnection() async {
        guard let client else {
            connectionMessage = "API 地址无效"
            return
        }
        do {
            let health = try await client.health()
            connectionMessage = health.ok ? "已连接 Forge API" : "Forge API 未就绪"
        } catch {
            connectionMessage = "未连接本地 Forge API"
            errorMessage = error.localizedDescription
        }
    }

    func refreshWorkspaces(selectFirst: Bool = false) async {
        guard let client else {
            errorMessage = "API 地址无效"
            return
        }
        do {
            let response = try await client.workspaces(limit: 18)
            workspaces = response.workspaces
            if selectFirst, selectedWorkspaceId == nil, let first = workspaces.first {
                await selectWorkspace(first)
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func selectWorkspace(_ workspace: ForgeWorkspaceSummary) async {
        guard let client else { return }
        selectedWorkspaceId = workspace.id
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            let response = try await client.plan(workspaceId: workspace.id)
            productPlan = response.productPlan
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func startDraft() {
        selectedWorkspaceId = nil
        productPlan = nil
        prompt = ""
        errorMessage = ""
    }

    func sendPrompt() async {
        let message = prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty, let client else { return }
        isLoading = true
        errorMessage = ""
        defer { isLoading = false }
        do {
            let response: ForgePlanResponse
            if let planId = productPlan?.planId {
                response = try await client.sendTurn(
                    workspaceId: planId,
                    sessionId: activeSessionId,
                    message: message,
                    runtimeProvider: runtimeProvider
                )
            } else {
                response = try await client.createPlan(
                    message: message,
                    language: language,
                    runtimeProvider: runtimeProvider
                )
            }
            if let plan = response.productPlan {
                productPlan = plan
                selectedWorkspaceId = plan.planId
                prompt = ""
                await refreshWorkspaces(selectFirst: false)
            } else {
                errorMessage = "Forge API did not return a ProductPlan."
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
