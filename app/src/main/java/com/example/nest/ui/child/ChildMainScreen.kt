package com.example.nest.ui.child

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.nest.data.model.AgeGroup
import com.example.nest.data.model.ChildProfile
import com.example.nest.viewmodel.NestViewModel

enum class ChildTab(val title: String, val selectedIcon: androidx.compose.ui.graphics.vector.ImageVector, val unselectedIcon: androidx.compose.ui.graphics.vector.ImageVector) {
    HOME("Home", Icons.Filled.Home, Icons.Outlined.Home),
    STORY("Story", Icons.Filled.AutoStories, Icons.Outlined.AutoStories),
    GAMES("Games", Icons.Filled.SportsEsports, Icons.Outlined.SportsEsports),
    CHAT("Companion", Icons.Filled.ChatBubble, Icons.Outlined.ChatBubbleOutline),
    PLACES("Places", Icons.Filled.Place, Icons.Outlined.Place),
    PROFILE("Profile", Icons.Filled.Person, Icons.Outlined.PersonOutline)
}

@Composable
fun ChildMainScreen(
    profile: ChildProfile,
    viewModel: NestViewModel
) {
    var currentTab by remember { mutableStateOf(ChildTab.HOME) }
    val totalPoints by viewModel.totalPoints.collectAsState()
    val moodEntries by viewModel.childMoodEntries.collectAsState()
    val pointsLedger by viewModel.pointsLedger.collectAsState()

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = Color.White,
                tonalElevation = 8.dp,
                windowInsets = WindowInsets.navigationBars
            ) {
                ChildTab.values().forEach { tab ->
                    val isSelected = currentTab == tab
                    NavigationBarItem(
                        selected = isSelected,
                        onClick = { currentTab = tab },
                        icon = {
                            Icon(
                                imageVector = if (isSelected) tab.selectedIcon else tab.unselectedIcon,
                                contentDescription = tab.title,
                                tint = if (isSelected) Color(0xFF6B46C1) else Color(0xFF78716C)
                            )
                        },
                        label = {
                            Text(
                                text = tab.title,
                                style = MaterialTheme.typography.labelSmall,
                                color = if (isSelected) Color(0xFF6B46C1) else Color(0xFF78716C)
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = Color(0xFFEDE9FE)
                        )
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (currentTab) {
                ChildTab.HOME -> {
                    if (profile.ageGroup == AgeGroup.SIX_TO_TEN) {
                        SixToTenHome(
                            profile = profile,
                            totalPoints = totalPoints,
                            moodEntries = moodEntries,
                            viewModel = viewModel,
                            onNavigateToStory = { currentTab = ChildTab.STORY },
                            onNavigateToGames = { currentTab = ChildTab.GAMES },
                            onNavigateToChat = { currentTab = ChildTab.CHAT },
                            onNavigateToPlaces = { currentTab = ChildTab.PLACES }
                        )
                    } else {
                        TenToFourteenHome(
                            profile = profile,
                            totalPoints = totalPoints,
                            moodEntries = moodEntries,
                            viewModel = viewModel,
                            onNavigateToStory = { currentTab = ChildTab.STORY },
                            onNavigateToGames = { currentTab = ChildTab.GAMES },
                            onNavigateToChat = { currentTab = ChildTab.CHAT },
                            onNavigateToPlaces = { currentTab = ChildTab.PLACES }
                        )
                    }
                }
                ChildTab.STORY -> StoryScreen(profile = profile, viewModel = viewModel)
                ChildTab.GAMES -> GamesScreen(profile = profile, viewModel = viewModel)
                ChildTab.CHAT -> CompanionChatScreen(profile = profile, viewModel = viewModel)
                ChildTab.PLACES -> PlacesCheckinScreen(profile = profile, viewModel = viewModel)
                ChildTab.PROFILE -> ChildProfileScreen(
                    profile = profile,
                    totalPoints = totalPoints,
                    pointsLedger = pointsLedger,
                    viewModel = viewModel
                )
            }
        }
    }
}
