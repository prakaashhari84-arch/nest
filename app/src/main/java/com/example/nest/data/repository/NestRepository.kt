package com.example.nest.data.repository

import com.example.nest.data.local.*
import com.example.nest.data.model.*
import com.example.nest.data.remote.GeminiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class NestRepository(
    private val dao: NestDao,
    private val scope: CoroutineScope
) {
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())

    val allProfiles: Flow<List<ChildProfile>> = dao.getAllProfiles().map { entities ->
        entities.map { it.toDomain() }
    }

    val allMoodEntries: Flow<List<MoodEntry>> = dao.getAllMoodEntries().map { entities ->
        entities.map { it.toDomain() }
    }

    val allAlerts: Flow<List<PatternAlert>> = dao.getAllAlerts().map { entities ->
        entities.map { it.toDomain() }
    }

    val allTherapyActivities: Flow<List<TherapyActivity>> = dao.getAllTherapyActivities().map { entities ->
        entities.map { it.toDomain() }
    }

    // In-memory catalog of badges, cosmetic items, and stories
    val badgesCatalog = listOf(
        Badge("b_1", "first_story", "First Story", "Completed your first cosmic adventure chapter.", "📖", "story"),
        Badge("b_2", "quiz_pro", "Quiz Pro", "Solved a daily word puzzle or memory challenge.", "🎯", "games"),
        Badge("b_3", "seven_day_streak", "7-Day Champion", "Kept a 7-day daily check-in streak alive!", "⚡", "streak", 7),
        Badge("b_4", "fourteen_day_streak", "Two-Week Star", "Reached an epic 14-day streak of daily check-ins.", "🌟", "streak", 14),
        Badge("b_5", "thirty_day_streak", "30-Day Master", "Master of consistency! A full month of checking in.", "👑", "streak", 30),
        Badge("b_6", "bookworm", "Bookworm", "Completed 3 or more adventure story chapters.", "📚", "story"),
        Badge("b_7", "place_explorer", "Place Explorer", "Checked in on how your everyday places feel.", "📍", "places"),
        Badge("b_8", "mindful_friend", "Mindful Friend", "Shared 5 or more daily mood reflections.", "💛", "reflection")
    )

    val cosmeticsCatalog = listOf(
        CosmeticItem("c_1", "Starlight Crown", 40, "👑", "crown", "A glowing golden tiara to crown your companion."),
        CosmeticItem("c_2", "Cosmic Aura", 60, "🌌", "cosmic_aura", "A deep nebula glow that softly shimmers around your mascot."),
        CosmeticItem("c_3", "Cozy Knit Scarf", 50, "🧣", "scarf", "A soft autumn scarf keeping your companion warm."),
        CosmeticItem("c_4", "Emerald Forest Hue", 80, "🌲", "forest", "Nature-inspired deep emerald and moss coloring."),
        CosmeticItem("c_5", "Sunset Gold Glow", 80, "🌅", "sunset", "Warm twilight gradient with golden amber sparks."),
        CosmeticItem("c_6", "Astro Explorer Helmet", 100, "🧑‍🚀", "astro", "High-tech galactic explorer gear for space adventures.")
    )

    val storyChapters = listOf(
        StoryChapter(
            index = 0,
            title = "The Glowing Nebula Gate",
            narrative = "High above the sleepy clouds of Planet Luma, you and your companion discover a shimmering archway made of spun starlight. A warm, humming chime echoes through the stardust, inviting you forward into the unknown sky.",
            imageEmoji = "🌌",
            choices = listOf(
                StoryChoice("Step through the glowing light beam", 15, 1),
                StoryChoice("Search the stardust crystals around the gate first", 15, 1)
            ),
            reflectionPrompt = "How do you feel when stepping into something new?"
        ),
        StoryChapter(
            index = 1,
            title = "The Whispering Forest of Whispers",
            narrative = "The gate gently transports you to an emerald forest where trees glow with soft turquoise moss. Friendly floating sprites gather around, offering glowing lanterns to light your path through the evening mist.",
            imageEmoji = "🌲",
            choices = listOf(
                StoryChoice("Ask the sprites for directions to the Star Peak", 15, 2),
                StoryChoice("Sit quietly by the glowing brook and rest", 15, 2)
            ),
            reflectionPrompt = "What brings you calm when your mind feels noisy?"
        ),
        StoryChapter(
            index = 2,
            title = "The Summit of Starlight",
            narrative = "At the peak of Star Mountain, the sky bursts into golden and violet aurora waves. Your companion smiles brightly, placing a constellation medallion into your hands. You did it together!",
            imageEmoji = "🏔️",
            choices = listOf(
                StoryChoice("Celebrate and plant the explorer flag", 25, 0),
                StoryChoice("Watch the shooting stars drift across the cosmos", 25, 0)
            ),
            reflectionPrompt = "What is one thing you are proud of today?"
        )
    )

    // Initial Seed data
    init {
        scope.launch(Dispatchers.IO) {
            seedInitialDataIfEmpty()
        }
    }

    private suspend fun seedInitialDataIfEmpty() {
        val now = System.currentTimeMillis()

        // 1. Seed child profiles
        val leo = ChildProfileEntity(
            userId = "user_child_01",
            id = "cp_leo",
            nickname = "Leo",
            age = 9,
            nationality = "United States",
            preferredLanguage = "English",
            hasTraumaHistory = false,
            ageGroup = "SIX_TO_TEN",
            onboardingComplete = true,
            companionName = "Pip",
            companionVibe = "CHILL",
            createdAt = now - 86400000L * 10,
            updatedAt = now
        )
        val maya = ChildProfileEntity(
            userId = "user_child_02",
            id = "cp_maya",
            nickname = "Maya",
            age = 12,
            nationality = "United States",
            preferredLanguage = "English",
            hasTraumaHistory = true,
            ageGroup = "TEN_TO_FOURTEEN",
            onboardingComplete = true,
            companionName = "Nova",
            companionVibe = "COOL",
            createdAt = now - 86400000L * 10,
            updatedAt = now
        )
        dao.insertProfile(leo)
        dao.insertProfile(maya)

        // 2. Seed Moods for Leo & Maya
        val moodList = listOf(
            MoodEntryEntity("m_1", "user_child_01", "HAPPY", "Played soccer at recess with friends!", "Felt super energized", now - 86400000L * 4),
            MoodEntryEntity("m_2", "user_child_01", "MILD", "Math quiz was a bit tricky today", "Needed a little break", now - 86400000L * 3),
            MoodEntryEntity("m_3", "user_child_01", "HAPPY", "Built a cool Lego fortress at home", "Pip helped me think of shapes", now - 86400000L * 2),
            MoodEntryEntity("m_4", "user_child_01", "HAPPY", "Read chapter 2 with Pip", "Looking forward to tomorrow!", now - 86400000L * 1),
            MoodEntryEntity("m_5", "user_child_02", "HAPPY", "Finished art sketching portfolio", "Felt peaceful in the library", now - 86400000L * 3),
            MoodEntryEntity("m_6", "user_child_02", "MILD", "Long school day, tired eyes", "Listened to music on the bus", now - 86400000L * 2),
            MoodEntryEntity("m_7", "user_child_02", "HAPPY", "Practiced violin duet with partner", "Felt accomplished", now - 86400000L * 1)
        )
        moodList.forEach { dao.insertMoodEntry(it) }

        // 3. Seed Points
        dao.insertPoints(PointsLedgerEntity("p_1", "user_child_01", 100, "Explorer Welcome Bonus", now - 86400000L * 5))
        dao.insertPoints(PointsLedgerEntity("p_2", "user_child_01", 20, "Word Scramble Solved", now - 86400000L * 3))
        dao.insertPoints(PointsLedgerEntity("p_3", "user_child_01", 15, "Story Chapter Read", now - 86400000L * 1))
        dao.insertPoints(PointsLedgerEntity("p_4", "user_child_02", 120, "Explorer Welcome Bonus", now - 86400000L * 5))

        // 4. Seed Place Ratings
        dao.insertPlaceRating(PlaceRatingEntity("user_child_01_SCHOOL", "user_child_01", "SCHOOL", 3, "Love art & recess", now))
        dao.insertPlaceRating(PlaceRatingEntity("user_child_01_HOME", "user_child_01", "HOME", 3, "Cozy reading corner", now))
        dao.insertPlaceRating(PlaceRatingEntity("user_child_01_PLAYGROUND", "user_child_01", "PLAYGROUND", 3, "Fun swings", now))
        dao.insertPlaceRating(PlaceRatingEntity("user_child_01_BEDROOM", "user_child_01", "BEDROOM", 3, "Soft warm bed", now))

        // 5. Seed Care Team Messages
        dao.insertCareTeamMessage(
            CareTeamMessageEntity(
                id = "msg_1",
                senderId = "clinician_01",
                senderName = "Dr. Marcus Vance, MD",
                senderRole = "CLINICIAN",
                childId = "user_child_01",
                content = "Hi Sarah! I reviewed Leo’s check-ins from this past week. He had high energy overall and connected wonderfully with Pip.",
                attachedVideoUrl = null,
                attachedTitle = null,
                createdAt = now - 86400000L * 2
            )
        )
        dao.insertCareTeamMessage(
            CareTeamMessageEntity(
                id = "msg_2",
                senderId = "parent_01",
                senderName = "Sarah Martinez (Parent)",
                senderRole = "PARENT",
                childId = "user_child_01",
                content = "Thank you Dr. Vance! We practiced deep belly breaths before bed and he loved the story chapter.",
                attachedVideoUrl = null,
                attachedTitle = null,
                createdAt = now - 86400000L * 1
            )
        )

        // 6. Seed Therapy Activities
        dao.insertTherapyActivity(
            TherapyActivityEntity(
                id = "act_1",
                clinicianId = "clinician_01",
                clinicianName = "Dr. Marcus Vance, MD",
                childId = "user_child_01",
                title = "Produce /s/ and /z/ sounds in conversation",
                instructions = "Practice during 5–10 minutes of conversational storytelling about favorite animals, gently praising clear /s/ and /z/ sounds.",
                targetSkill = "Speech & Articulation",
                status = "ASSIGNED",
                submissionCount = 0,
                lastSubmittedAt = null,
                createdAt = now - 86400000L * 3
            )
        )
        dao.insertTherapyActivity(
            TherapyActivityEntity(
                id = "act_2",
                clinicianId = "clinician_01",
                clinicianName = "Dr. Marcus Vance, MD",
                childId = "user_child_01",
                title = "Take turns during a structured board game",
                instructions = "Play a quick 2-player board game (like Connect 4 or Uno) verbalizing turn-taking transitions clearly ('My turn', 'Your turn!').",
                targetSkill = "Social Turn-Taking",
                status = "ASSIGNED",
                submissionCount = 0,
                lastSubmittedAt = null,
                createdAt = now - 86400000L * 4
            )
        )

        // 7. Seed Alerts
        dao.insertAlert(
            PatternAlertEntity(
                id = "alt_1",
                childId = "user_child_01",
                childName = "Leo",
                severity = "MILD",
                category = "SCHOOL_PRESSURE",
                summary = "Leo mentioned feeling slightly rushed during Tuesday's math test, followed by quick rebound during afternoon playtime.",
                suggestedStartersJson = "How did math feel this week?,What was your favorite puzzle today?",
                audience = "ALL",
                reviewedByHuman = false,
                reviewedAt = null,
                reviewerNote = null,
                status = "PENDING",
                createdAt = now - 86400000L * 1
            )
        )
    }

    fun getProfile(userId: String): Flow<ChildProfile?> = dao.getProfile(userId).map { it?.toDomain() }

    fun getMoodEntries(childId: String): Flow<List<MoodEntry>> = dao.getMoodEntries(childId).map { list ->
        list.map { it.toDomain() }
    }

    fun getPointsLedger(childId: String): Flow<List<PointsLedgerEntry>> = dao.getPointsLedger(childId).map { list ->
        list.map { it.toDomain() }
    }

    fun getConversationTurns(childId: String): Flow<List<ConversationTurn>> = dao.getConversationTurns(childId).map { list ->
        list.map { it.toDomain() }
    }

    fun getCareTeamMessages(childId: String): Flow<List<CareTeamMessage>> = dao.getCareTeamMessages(childId).map { list ->
        list.map { it.toDomain() }
    }

    fun getTherapyActivities(childId: String): Flow<List<TherapyActivity>> = dao.getTherapyActivities(childId).map { list ->
        list.map { it.toDomain() }
    }

    suspend fun saveMoodCheckin(childId: String, mood: MoodType, promptStarter: String?, note: String?) {
        val entry = MoodEntryEntity(
            id = "m_${System.currentTimeMillis()}",
            childId = childId,
            mood = mood.name,
            promptStarter = promptStarter,
            note = note,
            createdAt = System.currentTimeMillis()
        )
        dao.insertMoodEntry(entry)
        awardPoints(childId, 10, "Daily Mood Check-In")
    }

    suspend fun savePlaceRating(childId: String, placeType: PlaceType, score: Int, note: String?) {
        val entity = PlaceRatingEntity(
            id = "${childId}_${placeType.name}",
            childId = childId,
            placeType = placeType.name,
            score = score,
            note = note,
            updatedAt = System.currentTimeMillis()
        )
        dao.insertPlaceRating(entity)
        awardPoints(childId, 10, "Your Places Check-In")
    }

    suspend fun awardPoints(childId: String, amount: Int, reason: String) {
        val entity = PointsLedgerEntity(
            id = "p_${System.currentTimeMillis()}_${(100..999).random()}",
            childId = childId,
            amount = amount,
            reason = reason,
            createdAt = System.currentTimeMillis()
        )
        dao.insertPoints(entity)
    }

    suspend fun purchaseCosmetic(childId: String, item: CosmeticItem): Boolean {
        awardPoints(childId, -item.costPoints, "Cosmetic: ${item.name}")
        return true
    }

    suspend fun updateCompanionVibe(userId: String, newVibe: CompanionVibe) {
        val current = dao.getProfile(userId).firstOrNull() ?: return
        dao.insertProfile(current.copy(companionVibe = newVibe.name, updatedAt = System.currentTimeMillis()))
    }

    suspend fun sendCareTeamMessage(senderId: String, senderName: String, role: UserRole, childId: String, content: String) {
        val entity = CareTeamMessageEntity(
            id = "msg_${System.currentTimeMillis()}",
            senderId = senderId,
            senderName = senderName,
            senderRole = role.name,
            childId = childId,
            content = content,
            attachedVideoUrl = null,
            attachedTitle = null,
            createdAt = System.currentTimeMillis()
        )
        dao.insertCareTeamMessage(entity)
    }

    suspend fun assignTherapyGoal(clinicianId: String, clinicianName: String, childId: String, title: String, instructions: String, skill: String) {
        val entity = TherapyActivityEntity(
            id = "act_${System.currentTimeMillis()}",
            clinicianId = clinicianId,
            clinicianName = clinicianName,
            childId = childId,
            title = title,
            instructions = instructions,
            targetSkill = skill,
            status = "ASSIGNED",
            submissionCount = 0,
            lastSubmittedAt = null,
            createdAt = System.currentTimeMillis()
        )
        dao.insertTherapyActivity(entity)
    }

    suspend fun markAlertReviewed(alertId: String, note: String?) {
        dao.markAlertReviewed(alertId, System.currentTimeMillis(), note)
    }

    suspend fun sendCompanionMessage(profile: ChildProfile, userMessage: String): String {
        val now = System.currentTimeMillis()
        // Record child turn
        val childTurn = ConversationTurnEntity(
            id = "turn_${now}_child",
            childId = profile.userId,
            isFromChild = true,
            content = userMessage,
            severity = "NONE",
            reason = null,
            createdAt = now
        )
        dao.insertConversationTurn(childTurn)

        // Evaluate safety keywords
        val lower = userMessage.lowercase()
        var severity = SeverityLevel.NONE
        var reason = ""
        if ("hate myself" in lower || "want to disappear" in lower || "nobody cares" in lower) {
            severity = SeverityLevel.SERIOUS
            reason = "Expressing deep distress or self-harm ideation"
        } else if ("scared of dad" in lower || "hit me" in lower) {
            severity = SeverityLevel.SERIOUS
            reason = "Potential domestic physical safety flag"
        } else if ("failing" in lower || "bullied" in lower || "nobody plays with me" in lower) {
            severity = SeverityLevel.MILD
            reason = "Peer social conflict or school stress flag"
        }

        // If triggered, record alert
        if (severity != SeverityLevel.NONE) {
            val alert = PatternAlertEntity(
                id = "alt_${now}",
                childId = profile.userId,
                childName = profile.nickname,
                severity = severity.name,
                category = if (severity == SeverityLevel.SERIOUS) "SAFETY_INTERVENTION" else "EMOTIONAL_WELLNESS",
                summary = "${profile.nickname} expressed: \"$userMessage\" ($reason).",
                suggestedStartersJson = "How are things feeling at home and school?,We are here to support you anytime.",
                audience = "ALL",
                reviewedByHuman = false,
                reviewedAt = null,
                reviewerNote = null,
                status = "PENDING",
                createdAt = now
            )
            dao.insertAlert(alert)
        }

        // Build prompt instruction
        val isYoung = profile.ageGroup == AgeGroup.SIX_TO_TEN
        val systemPrompt = """
You are ${profile.companionName}, a warm, safe AI companion in the Nest child wellness app for ${profile.nickname} (Age ${profile.age}).
Vibe: ${profile.companionVibe.displayName}
CRITICAL MANDATES:
1. Never claim to be human.
2. Never diagnose medical or psychiatric conditions (like ADHD, depression, autism).
3. Never give clinical advice or prescribe medicine.
4. If the child discusses severe pain or fear, warmly encourage talking with a trusted parent, teacher, or doctor.
${if (isYoung) "Speak warmly in 2-3 complete, gentle, age-appropriate sentences. Never use baby-talk." else "Speak like a thoughtful, supportive peer friend in 3-4 natural sentences."}
${if (profile.hasTraumaHistory) "This child has indicated something difficult happened in their past. Be extra gentle, safe, and predictable. Never interrogate about traumatic events." else ""}
""".trimIndent()

        val turns = dao.getConversationTurns(profile.userId).firstOrNull() ?: emptyList()
        val history = turns.map { it.isFromChild to it.content }

        val reply = GeminiClient.generateCompanionReply(systemPrompt, history, userMessage)

        val companionTurn = ConversationTurnEntity(
            id = "turn_${System.currentTimeMillis()}_companion",
            childId = profile.userId,
            isFromChild = false,
            content = reply,
            severity = severity.name,
            reason = if (severity != SeverityLevel.NONE) reason else null,
            createdAt = System.currentTimeMillis()
        )
        dao.insertConversationTurn(companionTurn)

        return reply
    }
}

// Extension mappers
fun ChildProfileEntity.toDomain() = ChildProfile(
    id = id,
    userId = userId,
    nickname = nickname,
    age = age,
    nationality = nationality,
    preferredLanguage = preferredLanguage,
    hasTraumaHistory = hasTraumaHistory,
    ageGroup = try { AgeGroup.valueOf(ageGroup) } catch (e: Exception) { AgeGroup.SIX_TO_TEN },
    onboardingComplete = onboardingComplete,
    companionName = companionName,
    companionVibe = try { CompanionVibe.valueOf(companionVibe) } catch (e: Exception) { CompanionVibe.CHILL },
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun MoodEntryEntity.toDomain() = MoodEntry(
    id = id,
    childId = childId,
    mood = try { MoodType.valueOf(mood) } catch (e: Exception) { MoodType.HAPPY },
    promptStarter = promptStarter,
    note = note,
    createdAt = createdAt
)

fun PatternAlertEntity.toDomain() = PatternAlert(
    id = id,
    childId = childId,
    childName = childName,
    severity = try { SeverityLevel.valueOf(severity) } catch (e: Exception) { SeverityLevel.MILD },
    category = category,
    summary = summary,
    suggestedStarters = if (suggestedStartersJson.isNotBlank()) suggestedStartersJson.split(",") else emptyList(),
    audience = audience,
    reviewedByHuman = reviewedByHuman,
    reviewedAt = reviewedAt,
    reviewerNote = reviewerNote,
    status = status,
    createdAt = createdAt
)

fun PointsLedgerEntity.toDomain() = PointsLedgerEntry(
    id = id,
    childId = childId,
    amount = amount,
    reason = reason,
    createdAt = createdAt
)

fun ConversationTurnEntity.toDomain() = ConversationTurn(
    id = id,
    childId = childId,
    isFromChild = isFromChild,
    content = content,
    severity = try { SeverityLevel.valueOf(severity) } catch (e: Exception) { SeverityLevel.NONE },
    reason = reason,
    createdAt = createdAt
)

fun CareTeamMessageEntity.toDomain() = CareTeamMessage(
    id = id,
    senderId = senderId,
    senderName = senderName,
    senderRole = try { UserRole.valueOf(senderRole) } catch (e: Exception) { UserRole.CLINICIAN },
    childId = childId,
    content = content,
    attachedVideoUrl = attachedVideoUrl,
    attachedTitle = attachedTitle,
    createdAt = createdAt
)

fun TherapyActivityEntity.toDomain() = TherapyActivity(
    id = id,
    clinicianId = clinicianId,
    clinicianName = clinicianName,
    childId = childId,
    title = title,
    instructions = instructions,
    targetSkill = targetSkill,
    status = status,
    submissionCount = submissionCount,
    lastSubmittedAt = lastSubmittedAt,
    createdAt = createdAt
)
