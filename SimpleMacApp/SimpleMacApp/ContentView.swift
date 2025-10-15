import SwiftUI

struct ContentView: View {
    var body: some View {
        VStack {
            Text("Hello, macOS!")
                .font(.largeTitle)
                .padding()
        }
        .frame(minWidth: 400, minHeight: 300)
    }
}

#Preview {
    ContentView()
}
