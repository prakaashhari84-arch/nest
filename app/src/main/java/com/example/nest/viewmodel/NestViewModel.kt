package com.example.nest.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.nest.data.model.*
import com.example.nest.data.repository.NestRepository
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class NestViewModel(
    private val repository: NestRepository
) : ViewModel() {

    // Pre-configured role accounts
    val mockUsers = listOf(
        AppUser("user_child_01", "Leo (Age 9)", "leo@nest.care", UserRole.CHILD, listOf("user_child_01")),
        AppUser("user_child_02", "Maya (Age 12)", "maya@nest.care", UserRole.CHILD, listOf("user_child_02")),
        AppUser("parent_01", "Sarah Martinez", "sarah@nest.care", UserRole.PARENT, listOf("user_child_01", "user_child_02")),
        AppUser("clinician_01", "Dr. Marcus Vance, MD", "dr.vance@nest.care", UserRole.CLINICIAN, listOf("user_child_01", "user_child_02"))
    )

    private val _currentUser = MutableStateFlow(mockUsers[0]) // Default: Leo
    val currentUser: StateFlow<AppUser> = _currentUser.asStateFlow()

    private val _selectedChildId = MutableStateFlow("user_child_01")
    val selectedChildId: StateFlow<String> = _selectedChildId.asStateFlow()

    // Active Child Profile
    val currentChildProfile: StateFlow<ChildProfile?> = _selectedChildId
        .flatMapLatest { childId -> repository.getProfile(childId) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val allChildProfiles: StateFlow<List<ChildProfile>> = repository.allProfiles
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Active Child Moods
    val childMoodEntries: StateFlow<List<MoodEntry>> = _selectedChildId
        .flatMapLatest { childId -> repository.getMoodEntries(childId) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allMoodEntries: StateFlow<List<MoodEntry>> = repository.allMoodEntries
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Active Child Points
    val pointsLedger: StateFlow<List<PointsLedgerEntry>> = _selectedChildId
        .flatMapLatest { childId -> repository.getPointsLedger(childId) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalPoints: StateFlow<Int> = pointsLedger.map { list ->
        list.sumOf { it.amount }.coerceAtLeast(0)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    // Chat Turns
    val conversationTurns: StateFlow<List<ConversationTurn>> = _selectedChildId
        .flatMapLatest { childId -> repository.getConversationTurns(childId) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Care Team Messages
    val careTeamMessages: StateFlow<List<CareTeamMessage>> = _selectedChildId
        .flatMapLatest { childId -> repository.getCareTeamMessages(childId) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Therapy Activities
    val therapyActivities: StateFlow<List<TherapyActivity>> = _selectedChildId
        .flatMapLatest { childId -> repository.getTherapyActivities(childId) }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allTherapyActivities: StateFlow<List<TherapyActivity>> = repository.allTherapyActivities
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Alerts
    val allAlerts: StateFlow<List<PatternAlert>> = repository.allAlerts
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Story progress
    private val _currentStoryChapterIndex = MutableStateFlow(0)
    val currentStoryChapterIndex: StateFlow<Int> = _currentStoryChapterIndex.asStateFlow()

    // Loading & chat states
    private val _isCompanionTyping = MutableStateFlow(false)
    val isCompanionTyping: StateFlow<Boolean> = _isCompanionTyping.asStateFlow()

    val badgesCatalog = repository.badgesCatalog
    val cosmeticsCatalog = repository.cosmeticsCatalog
    val storyChapters = repository.storyChapters

    fun switchUser(user: AppUser) {
        _currentUser.value = user
        if (user.role == UserRole.CHILD) {
            _selectedChildId.value = user.id
        } else if (user.linkedChildIds.isNotEmpty() && !_selectedChildId.value.let { user.linkedChildIds.contains(it) }) {
            _selectedChildId.value = user.linkedChildIds.first()
        }
    }

    fun selectChild(childId: String) {
        _selectedChildId.value = childId
    }

    fun submitMoodCheckin(mood: MoodType, promptStarter: String?, note: String?) {
        val childId = _selectedChildId.value
        viewModelScope.launch {
            repository.saveMoodCheckin(childId, mood, promptStarter, note)
        }
    }

    fun submitPlaceRating(place: PlaceType, score: Int, note: String?) {
        val childId = _selectedChildId.value
        viewModelScope.launch {
            repository.savePlaceRating(childId, place, score, note)
        }
    }

    fun sendCompanionMessage(userMessage: String) {
        val profile = currentChildProfile.value ?: return
        if (userMessage.isBlank()) return

        viewModelScope.launch {
            _isCompanionTyping.value = true
            try {
                repository.sendCompanionMessage(profile, userMessage.trim())
            } finally {
                _isCompanionTyping.value = false
            }
        }
    }

    fun sendCareTeamMessage(content: String) {
        val user = _currentUser.value
        val childId = _selectedChildId.value
        if (content.isBlank()) return

        viewModelScope.launch {
            repository.sendCareTeamMessage(
                senderId = user.id,
                senderName = user.name,
                role = user.role,
                childId = childId,
                content = content.trim()
            )
        }
    }

    fun assignTherapyGoal(title: String, instructions: String, skill: String) {
        val user = _currentUser.value
        val childId = _selectedChildId.value
        if (title.isBlank()) return

        viewModelScope.launch {
            repository.assignTherapyGoal(
                clinicianId = user.id,
                clinicianName = user.name,
                childId = childId,
                title = title.trim(),
                instructions = instructions.trim(),
                skill = skill.trim()
            )
        }
    }

    fun markAlertReviewed(alertId: String, note: String?) {
        viewModelScope.launch {
            repository.markAlertReviewed(alertId, note)
        }
    }

    fun buyCosmetic(item: CosmeticItem) {
        val childId = _selectedChildId.value
        viewModelScope.launch {
            repository.purchaseCosmetic(childId, item)
        }
    }

    fun updateCompanionVibe(vibe: CompanionVibe) {
        val childId = _selectedChildId.value
        viewModelScope.launch {
            repository.updateCompanionVibe(childId, vibe)
        }
    }

    fun advanceStoryChapter(nextIndex: Int, points: Int) {
        _currentStoryChapterIndex.value = nextIndex
        val childId = _selectedChildId.value
        viewModelScope.launch {
            repository.awardPoints(childId, points, "Story Chapter Completed")
        }
    }

    fun earnGamePoints(amount: Int, gameName: String) {
        val childId = _selectedChildId.value
        viewModelScope.launch {
            repository.awardPoints(childId, amount, "Game: $gameName")
        }
    }
}

class NestViewModelFactory(
    private val repository: NestRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return NestViewModel(repository) as T
    }
}
