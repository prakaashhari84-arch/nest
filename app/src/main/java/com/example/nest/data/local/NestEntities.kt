package com.example.nest.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "child_profiles")
data class ChildProfileEntity(
    @PrimaryKey val userId: String,
    val id: String,
    val nickname: String,
    val age: Int,
    val nationality: String,
    val preferredLanguage: String,
    val hasTraumaHistory: Boolean,
    val ageGroup: String,
    val onboardingComplete: Boolean,
    val companionName: String,
    val companionVibe: String,
    val createdAt: Long,
    val updatedAt: Long
)

@Entity(tableName = "mood_entries")
data class MoodEntryEntity(
    @PrimaryKey val id: String,
    val childId: String,
    val mood: String,
    val promptStarter: String?,
    val note: String?,
    val createdAt: Long
)

@Entity(tableName = "place_ratings")
data class PlaceRatingEntity(
    @PrimaryKey val id: String, // childId_placeType
    val childId: String,
    val placeType: String,
    val score: Int,
    val note: String?,
    val updatedAt: Long
)

@Entity(tableName = "pattern_alerts")
data class PatternAlertEntity(
    @PrimaryKey val id: String,
    val childId: String,
    val childName: String,
    val severity: String,
    val category: String,
    val summary: String,
    val suggestedStartersJson: String,
    val audience: String,
    val reviewedByHuman: Boolean,
    val reviewedAt: Long?,
    val reviewerNote: String?,
    val status: String,
    val createdAt: Long
)

@Entity(tableName = "points_ledger")
data class PointsLedgerEntity(
    @PrimaryKey val id: String,
    val childId: String,
    val amount: Int,
    val reason: String,
    val createdAt: Long
)

@Entity(tableName = "conversation_turns")
data class ConversationTurnEntity(
    @PrimaryKey val id: String,
    val childId: String,
    val isFromChild: Boolean,
    val content: String,
    val severity: String,
    val reason: String?,
    val createdAt: Long
)

@Entity(tableName = "care_team_messages")
data class CareTeamMessageEntity(
    @PrimaryKey val id: String,
    val senderId: String,
    val senderName: String,
    val senderRole: String,
    val childId: String,
    val content: String,
    val attachedVideoUrl: String?,
    val attachedTitle: String?,
    val createdAt: Long
)

@Entity(tableName = "therapy_activities")
data class TherapyActivityEntity(
    @PrimaryKey val id: String,
    val clinicianId: String,
    val clinicianName: String,
    val childId: String,
    val title: String,
    val instructions: String,
    val targetSkill: String,
    val status: String,
    val submissionCount: Int,
    val lastSubmittedAt: Long?,
    val createdAt: Long
)

@Entity(tableName = "activity_logs")
data class ActivityLogEntity(
    @PrimaryKey val id: String,
    val childId: String,
    val topicSummary: String,
    val category: String,
    val tagsJson: String,
    val emoji: String,
    val sentimentVibe: String,
    val createdAt: Long
)
