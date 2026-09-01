package com.example.nest.data.model

import kotlinx.serialization.Serializable

enum class UserRole {
    CHILD, PARENT, CLINICIAN
}

@Serializable
data class AppUser(
    val id: String,
    val name: String,
    val email: String,
    val role: UserRole,
    val linkedChildIds: List<String> = emptyList()
)

enum class AgeGroup {
    SIX_TO_TEN, TEN_TO_FOURTEEN
}

enum class CompanionVibe(val displayName: String, val emoji: String, val subtitle: String) {
    CHILL("Chill & Mindful", "🌿", "Calm breaths, steady pace"),
    HYPE("Hype & Playful", "⚡", "High energy, enthusiastic high-fives"),
    COZY("Cozy & Nurturing", "🧸", "Warm soft hugs, gentle reassuring words"),
    COOL("Cool & Inquisitive", "✨", "Fascinating facts, creative explorations")
}

@Serializable
data class ChildProfile(
    val id: String,
    val userId: String,
    val nickname: String,
    val age: Int,
    val nationality: String = "Global",
    val preferredLanguage: String = "English",
    val hasTraumaHistory: Boolean = false,
    val ageGroup: AgeGroup = AgeGroup.SIX_TO_TEN,
    val onboardingComplete: Boolean = true,
    val companionName: String = "Pip",
    val companionVibe: CompanionVibe = CompanionVibe.CHILL,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

enum class MoodType(val score: Int, val emoji: String, val label: String) {
    HAPPY(3, "😊", "Happy & Bright"),
    MILD(2, "😐", "Just Okay"),
    SAD(1, "😔", "Tough & Heavy")
}

enum class PlaceType(val displayName: String, val emoji: String) {
    SCHOOL("School & Class", "🏫"),
    HOME("Home & Family", "🏠"),
    PLAYGROUND("Playground & Friends", "🛝"),
    BEDROOM("Bedtime & Room", "🌙")
}

@Serializable
data class MoodEntry(
    val id: String,
    val childId: String,
    val mood: MoodType,
    val promptStarter: String? = null,
    val note: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class PlaceRating(
    val place: PlaceType,
    val score: Int, // 1 (Bad), 2 (Okay), 3 (Great)
    val note: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
)

enum class SeverityLevel {
    NONE, MILD, SERIOUS
}

@Serializable
data class EscalationTrigger(
    val keywordOrPattern: String,
    val severity: SeverityLevel,
    val description: String = ""
)

@Serializable
data class RuleSet(
    val id: String,
    val clinicianId: String,
    val childId: String? = null, // null for global default
    val version: Int = 1,
    val allowedTopics: List<String>,
    val forbiddenTopics: List<String>,
    val escalationTriggers: List<EscalationTrigger>,
    val toneGuidelines: String,
    val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
data class PatternAlert(
    val id: String,
    val childId: String,
    val childName: String,
    val severity: SeverityLevel,
    val category: String,
    val summary: String,
    val suggestedStarters: List<String> = emptyList(),
    val audience: String = "ALL", // "PARENT", "CLINICIAN", "ALL"
    val reviewedByHuman: Boolean = false,
    val reviewedAt: Long? = null,
    val reviewerNote: String? = null,
    val status: String = "PENDING", // PENDING, REVIEWED, DISMISSED
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class PointsLedgerEntry(
    val id: String,
    val childId: String,
    val amount: Int,
    val reason: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class StreakRecord(
    val childId: String,
    val currentStreak: Int,
    val longestStreak: Int,
    val lastActiveDate: String, // YYYY-MM-DD
    val celebratedMilestones: List<Int> = emptyList()
)

@Serializable
data class Badge(
    val id: String,
    val key: String,
    val name: String,
    val description: String,
    val iconEmoji: String,
    val category: String,
    val milestoneStreak: Int? = null
)

@Serializable
data class CosmeticItem(
    val id: String,
    val name: String,
    val costPoints: Int,
    val iconEmoji: String,
    val themeValue: String,
    val description: String
)

@Serializable
data class StoryChapter(
    val index: Int,
    val title: String,
    val narrative: String,
    val imageEmoji: String,
    val choices: List<StoryChoice>,
    val reflectionPrompt: String? = null
)

@Serializable
data class StoryChoice(
    val text: String,
    val pointsAwarded: Int = 15,
    val nextChapterIndex: Int
)

@Serializable
data class TherapyActivity(
    val id: String,
    val clinicianId: String,
    val clinicianName: String,
    val childId: String,
    val title: String,
    val instructions: String,
    val targetSkill: String,
    val status: String = "ASSIGNED", // ASSIGNED, SUBMITTED, REVIEWED
    val submissionCount: Int = 0,
    val lastSubmittedAt: Long? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class TherapySubmission(
    val id: String,
    val activityId: String,
    val childId: String,
    val parentId: String,
    val videoUrl: String,
    val parentNotes: String,
    val clinicianFeedback: String? = null,
    val reviewed: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class CareTeamMessage(
    val id: String,
    val senderId: String,
    val senderName: String,
    val senderRole: UserRole,
    val childId: String,
    val content: String,
    val attachedVideoUrl: String? = null,
    val attachedTitle: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class AvailabilitySlot(
    val id: String,
    val clinicianId: String,
    val clinicianName: String,
    val startTime: Long,
    val endTime: Long,
    val isBooked: Boolean = false,
    val bookedForChildId: String? = null,
    val bookedByParentName: String? = null
)

@Serializable
data class ActivityLogEntry(
    val id: String,
    val childId: String,
    val topicSummary: String,
    val category: String,
    val tags: List<String>,
    val emoji: String,
    val sentimentVibe: String = "positive",
    val createdAt: Long = System.currentTimeMillis()
)

@Serializable
data class ConversationTurn(
    val id: String,
    val childId: String,
    val isFromChild: Boolean,
    val content: String,
    val severity: SeverityLevel = SeverityLevel.NONE,
    val reason: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)
