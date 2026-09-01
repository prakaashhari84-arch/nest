package com.example.nest.data.remote

import com.example.nest.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.Query
import java.util.concurrent.TimeUnit

@Serializable
data class GenerateContentRequest(
    val contents: List<Content>,
    val generationConfig: GenerationConfig? = null,
    val tools: List<JsonObject>? = null,
    val systemInstruction: Content? = null
)

@Serializable
data class Content(
    val parts: List<Part>,
    val role: String? = null
)

@Serializable
data class Part(
    val text: String? = null
)

@Serializable
data class GenerationConfig(
    val temperature: Float? = null,
    val topP: Float? = null,
    val topK: Int? = null,
    val maxOutputTokens: Int? = null
)

@Serializable
data class GenerateContentResponse(
    val candidates: List<Candidate> = emptyList()
)

@Serializable
data class Candidate(
    val content: Content? = null,
    val finishReason: String? = null
)

interface GeminiApiService {
    @POST("v1beta/models/gemini-3.5-flash:generateContent")
    suspend fun generateContent(
        @Query("key") apiKey: String,
        @Body request: GenerateContentRequest
    ): GenerateContentResponse
}

object RetrofitClient {
    private const val BASE_URL = "https://generativelanguage.googleapis.com/"

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        .build()

    val service: GeminiApiService by lazy {
        val json = Json {
            ignoreUnknownKeys = true
            encodeDefaults = true
        }
        val retrofit = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
        retrofit.create(GeminiApiService::class.java)
    }
}

object GeminiClient {
    suspend fun generateCompanionReply(
        systemInstruction: String,
        history: List<Pair<Boolean, String>>, // (isChild, text)
        userMessage: String
    ): String = withContext(Dispatchers.IO) {
        val apiKey = try {
            BuildConfig.GEMINI_API_KEY
        } catch (e: Exception) {
            ""
        }

        if (apiKey.isBlank()) {
            return@withContext getFallbackReply(userMessage)
        }

        try {
            val contentList = mutableListOf<Content>()
            for ((isChild, text) in history.takeLast(6)) {
                contentList.add(
                    Content(
                        parts = listOf(Part(text = text)),
                        role = if (isChild) "user" else "model"
                    )
                )
            }
            contentList.add(
                Content(
                    parts = listOf(Part(text = userMessage)),
                    role = "user"
                )
            )

            val request = GenerateContentRequest(
                contents = contentList,
                systemInstruction = Content(
                    parts = listOf(Part(text = systemInstruction))
                ),
                generationConfig = GenerationConfig(
                    temperature = 0.6f,
                    maxOutputTokens = 350
                )
            )

            val response = RetrofitClient.service.generateContent(apiKey, request)
            val reply = response.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text
            if (!reply.isNullOrBlank()) {
                reply.trim()
            } else {
                getFallbackReply(userMessage)
            }
        } catch (e: Exception) {
            getFallbackReply(userMessage)
        }
    }

    private fun getFallbackReply(userMessage: String): String {
        val lower = userMessage.lowercase()
        return when {
            "sad" in lower || "upset" in lower || "crying" in lower ->
                "I hear you, and it is completely okay to feel that way. Take a slow, gentle breath with me. Would you like to read a cozy story together or just relax for a minute?"
            "angry" in lower || "mad" in lower ->
                "Big feelings can feel like sudden thunderstorms. Let's do 3 deep balloon breaths together: breathe in... and let it all out. You are safe here."
            "happy" in lower || "great" in lower || "fun" in lower ->
                "That is wonderful! Your positive energy lights up the entire room! What was the best part of your day?"
            "game" in lower || "play" in lower ->
                "I love playing games! Check out the Games tab for word scrambles, matching challenges, and fun brain puzzles!"
            "story" in lower ->
                "Stories are magical journeys. Head over to our Cosmic Story tab to continue our galactic adventure together!"
            else ->
                "Thank you for sharing that with me! I am always right here by your side. How is the rest of your day going so far?"
        }
    }
}
