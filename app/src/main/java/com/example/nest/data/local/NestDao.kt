package com.example.nest.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface NestDao {
    // Child Profiles
    @Query("SELECT * FROM child_profiles WHERE userId = :userId LIMIT 1")
    fun getProfile(userId: String): Flow<ChildProfileEntity?>

    @Query("SELECT * FROM child_profiles")
    fun getAllProfiles(): Flow<List<ChildProfileEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfile(profile: ChildProfileEntity)

    // Mood Entries
    @Query("SELECT * FROM mood_entries WHERE childId = :childId ORDER BY createdAt DESC")
    fun getMoodEntries(childId: String): Flow<List<MoodEntryEntity>>

    @Query("SELECT * FROM mood_entries ORDER BY createdAt DESC")
    fun getAllMoodEntries(): Flow<List<MoodEntryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMoodEntry(entry: MoodEntryEntity)

    // Place Ratings
    @Query("SELECT * FROM place_ratings WHERE childId = :childId")
    fun getPlaceRatings(childId: String): Flow<List<PlaceRatingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlaceRating(rating: PlaceRatingEntity)

    // Pattern Alerts
    @Query("SELECT * FROM pattern_alerts WHERE childId = :childId ORDER BY createdAt DESC")
    fun getAlertsForChild(childId: String): Flow<List<PatternAlertEntity>>

    @Query("SELECT * FROM pattern_alerts ORDER BY createdAt DESC")
    fun getAllAlerts(): Flow<List<PatternAlertEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAlert(alert: PatternAlertEntity)

    @Query("UPDATE pattern_alerts SET reviewedByHuman = 1, reviewedAt = :reviewedAt, reviewerNote = :note, status = 'REVIEWED' WHERE id = :alertId")
    suspend fun markAlertReviewed(alertId: String, reviewedAt: Long, note: String?)

    // Points Ledger
    @Query("SELECT * FROM points_ledger WHERE childId = :childId ORDER BY createdAt DESC")
    fun getPointsLedger(childId: String): Flow<List<PointsLedgerEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPoints(entry: PointsLedgerEntity)

    // Conversation Turns
    @Query("SELECT * FROM conversation_turns WHERE childId = :childId ORDER BY createdAt ASC")
    fun getConversationTurns(childId: String): Flow<List<ConversationTurnEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertConversationTurn(turn: ConversationTurnEntity)

    // Care Team Messages
    @Query("SELECT * FROM care_team_messages WHERE childId = :childId ORDER BY createdAt ASC")
    fun getCareTeamMessages(childId: String): Flow<List<CareTeamMessageEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCareTeamMessage(message: CareTeamMessageEntity)

    // Therapy Activities
    @Query("SELECT * FROM therapy_activities WHERE childId = :childId ORDER BY createdAt DESC")
    fun getTherapyActivities(childId: String): Flow<List<TherapyActivityEntity>>

    @Query("SELECT * FROM therapy_activities ORDER BY createdAt DESC")
    fun getAllTherapyActivities(): Flow<List<TherapyActivityEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTherapyActivity(activity: TherapyActivityEntity)

    @Query("UPDATE therapy_activities SET status = :status, submissionCount = submissionCount + 1, lastSubmittedAt = :timestamp WHERE id = :id")
    suspend fun updateActivityStatus(id: String, status: String, timestamp: Long)

    // Activity Logs
    @Query("SELECT * FROM activity_logs WHERE childId = :childId ORDER BY createdAt DESC")
    fun getActivityLogs(childId: String): Flow<List<ActivityLogEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertActivityLog(log: ActivityLogEntity)
}
