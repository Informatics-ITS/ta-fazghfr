"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, FileText, Brain, AlertCircle } from "lucide-react"

type ModelType = "ground_truth" | "noprompt" | "prompted" | "textattack"

interface InferenceResult {
  prediction: string
  confidence?: number
}

export default function MBTIInferencePage() {
  const [modelType, setModelType] = useState<ModelType>("ground_truth")
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:5000")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InferenceResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Manual input states
  const [singleText, setSingleText] = useState("")
  const [multipleTexts, setMultipleTexts] = useState("")

  // CSV input states
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPosts, setCsvPosts] = useState<string[]>([])

  const handleSingleInference = async () => {
    if (!singleText.trim()) {
      setError("Please enter some text for inference")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${apiBaseUrl}/inference`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_type: modelType,
          text: singleText.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during inference")
    } finally {
      setLoading(false)
    }
  }

  const handleMultipleInference = async (posts: string[]) => {
    if (posts.length === 0) {
      setError("Please provide posts for inference")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`${apiBaseUrl}/inference/multiple_posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model_type: modelType,
          posts: posts,
        }),
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during inference")
    } finally {
      setLoading(false)
    }
  }

  const handleManualMultipleInference = () => {
    const posts = multipleTexts
        .split("\n")
        .map((post) => post.trim())
        .filter((post) => post.length > 0)

    handleMultipleInference(posts)
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n").filter((line) => line.trim())

      // Skip header if it exists
      const dataLines = lines[0].toLowerCase().includes("posts") ? lines.slice(1) : lines

      const posts: string[] = []
      dataLines.forEach((line) => {
        const postsInLine = line
            .split("|||")
            .map((post) => post.trim())
            .filter((post) => post.length > 0)
        posts.push(...postsInLine)
      })

      setCsvPosts(posts)
    }

    reader.readAsText(file)
  }

  const handleCsvInference = () => {
    handleMultipleInference(csvPosts)
  }

  const getModelName = (modelType: ModelType) => {
    switch (modelType) {
      case "ground_truth":
        return "Ground Truth"
      case "noprompt":
        return "No Prompt"
      case "prompted":
        return "Prompt"
      case "textattack":
        return "Text Attack"
    }
  }

  return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            MBTI Inference Tool
          </h1>
          <p className="text-muted-foreground">
            Prediksi MBTI dengan D-DGCN yang dilatih dengan berbagai metode augmentasi pada Dataset
          </p>
        </div>

        {/* Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Set up your API endpoint and model preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">API Base URL</Label>
                <Input
                    id="api-url"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    placeholder="http://localhost:8000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model-type">Model Type</Label>
                <Select value={modelType} onValueChange={(value: ModelType) => setModelType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ground_truth">Ground Truth</SelectItem>
                    <SelectItem value="noprompt">No Prompt</SelectItem>
                    <SelectItem value="prompted">Prompt</SelectItem>
                    <SelectItem value="textattack">Text Attack</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Input Methods */}
        <Tabs defaultValue="manual" className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manual Input
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              CSV Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Single Post */}
              <Card>
                <CardHeader>
                  <CardTitle>Single Post Analysis</CardTitle>
                  <CardDescription>Analyze a single text post for MBTI prediction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="single-text">Text Content</Label>
                    <Textarea
                        id="single-text"
                        value={singleText}
                        onChange={(e) => setSingleText(e.target.value)}
                        placeholder="Enter the text you want to analyze..."
                        rows={6}
                    />
                  </div>
                  <Button onClick={handleSingleInference} disabled={loading || !singleText.trim()} className="w-full">
                    {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                    ) : (
                        "Analyze Single Post"
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Multiple Posts */}
              <Card>
                <CardHeader>
                  <CardTitle>Multiple Posts Analysis</CardTitle>
                  <CardDescription>Analyze multiple posts (one per line) for combined MBTI prediction</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="multiple-texts">Text Content (One per line)</Label>
                    <Textarea
                        id="multiple-texts"
                        value={multipleTexts}
                        onChange={(e) => setMultipleTexts(e.target.value)}
                        placeholder="Enter multiple posts, one per line..."
                        rows={6}
                    />
                  </div>
                  <Button
                      onClick={handleManualMultipleInference}
                      disabled={loading || !multipleTexts.trim()}
                      className="w-full"
                  >
                    {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                    ) : (
                        "Analyze Multiple Posts"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="csv">
            <Card>
              <CardHeader>
                <CardTitle>CSV File Upload</CardTitle>
                <CardDescription>Upload a CSV file with posts separated by "|||" in a single column</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <Input id="csv-file" type="file" accept=".csv" onChange={handleCsvUpload} />
                  <p className="text-sm text-muted-foreground">
                    Expected format: CSV with "posts" column, where multiple posts are separated by "|||"
                  </p>
                </div>

                {csvPosts.length > 0 && (
                    <div className="space-y-2">
                      <Label>Extracted Posts ({csvPosts.length} found)</Label>
                      <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50">
                        {csvPosts.slice(0, 5).map((post, index) => (
                            <div key={index} className="text-sm mb-1 truncate">
                              {index + 1}. {post}
                            </div>
                        ))}
                        {csvPosts.length > 5 && (
                            <div className="text-sm text-muted-foreground">... and {csvPosts.length - 5} more posts</div>
                        )}
                      </div>
                    </div>
                )}

                <Button onClick={handleCsvInference} disabled={loading || csvPosts.length === 0} className="w-full">
                  {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                  ) : (
                      `Analyze CSV Posts (${csvPosts.length} posts)`
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results */}
        {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {result && (
            <Card>
              <CardHeader>
                <CardTitle>Inference Result</CardTitle>
                <CardDescription>MBTI personality type prediction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mt-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Predicted MBTI Type</Label>
                    {/* We add '?' (optional chaining) in case 'result.label' doesn't exist */}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default" className="text-lg px-3 py-1">
                        {result.prediction || 'N/A'}
                      </Badge>
                      {result?.confidence && (
                          <span className="text-sm text-muted-foreground">
                Confidence: {(result.confidence * 100).toFixed(1)}%
              </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-sm text-muted-foreground">Model Used</Label>
                  <p className="text-sm font-medium">{getModelName(modelType)}</p>
                </div>
              </CardContent>
            </Card>
        )}
      </div>
  )
}