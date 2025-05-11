export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    // Import JSZip dynamically
    const JSZip = (await import("jszip")).default

    // Create a new ZIP file
    const zip = new JSZip()

    // Add some files to the ZIP
    zip.file("hello.txt", "Hello World!")
    zip.file("info.txt", `Generated at: ${new Date().toISOString()}`)

    // Create a folder
    const folder = zip.folder("folder")
    folder.file("test.txt", "Test file in folder")

    // Generate the ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Return the ZIP file
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="test-archive.zip"`,
      },
    })
  } catch (error) {
    console.error("Error generating ZIP:", error)

    return new Response(`Error: ${error.message || "Unknown error"}`, {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
