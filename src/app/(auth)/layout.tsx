"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { TableModeProvider } from "@/components/table-mode-provider";
import { Providers } from "@/components/providers";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            <Providers>
                <TableModeProvider>
                    <div style={{
                        minHeight: "100vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        {children}
                    </div>
                </TableModeProvider>
            </Providers>
        </ThemeProvider>
    );
}