package com.example.nest.ui.child

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.nest.data.model.ChildProfile
import com.example.nest.viewmodel.NestViewModel

@Composable
fun GamesScreen(
    profile: ChildProfile,
    viewModel: NestViewModel
) {
    var activeTab by remember { mutableStateOf(0) } // 0: Word Scramble, 1: 4-7-8 Breathing, 2: Memory Match

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Tab Selector Row
        TabRow(
            selectedTabIndex = activeTab,
            containerColor = Color.Transparent,
            contentColor = Color(0xFF6B46C1),
            divider = {}
        ) {
            Tab(
                selected = activeTab == 0,
                onClick = { activeTab = 0 },
                text = { Text("Word Puzzle 🔠", fontWeight = FontWeight.Bold) }
            )
            Tab(
                selected = activeTab == 1,
                onClick = { activeTab = 1 },
                text = { Text("Calm Breath 🌿", fontWeight = FontWeight.Bold) }
            )
            Tab(
                selected = activeTab == 2,
                onClick = { activeTab = 2 },
                text = { Text("Memory 🃏", fontWeight = FontWeight.Bold) }
            )
        }

        Box(modifier = Modifier.weight(1f)) {
            when (activeTab) {
                0 -> WordScrambleGame(viewModel = viewModel)
                1 -> BreathingGame(viewModel = viewModel)
                2 -> MemoryMatchGame(viewModel = viewModel)
            }
        }
    }
}

@Composable
fun WordScrambleGame(viewModel: NestViewModel) {
    val puzzles = listOf(
        "KIND" to "DNIK",
        "BRAVE" to "EVARB",
        "PEACE" to "CEPAE",
        "SMILE" to "LEIMS",
        "STRONG" to "TGNROS"
    )
    var currentPuzzleIndex by remember { mutableStateOf(0) }
    var userInput by remember { mutableStateOf("") }
    var resultMessage by remember { mutableStateOf<String?>(null) }
    var score by remember { mutableStateOf(0) }

    val (correctWord, scrambled) = puzzles[currentPuzzleIndex]

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "WORD UNSCRAMBLE",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFF78716C)
                )
                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = scrambled,
                    fontSize = 36.sp,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 6.sp,
                    color = Color(0xFF6B46C1)
                )

                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Hint: A superpower feeling inside you!",
                    fontSize = 12.sp,
                    color = Color(0xFF78716C)
                )

                Spacer(modifier = Modifier.height(20.dp))

                OutlinedTextField(
                    value = userInput,
                    onValueChange = { userInput = it.uppercase() },
                    placeholder = { Text("Type word here...") },
                    singleLine = true,
                    textStyle = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Button(
                    onClick = {
                        if (userInput.trim().equals(correctWord, ignoreCase = true)) {
                            resultMessage = "Awesome job! You solved $correctWord! 🎉 +15 Sparkles"
                            viewModel.earnGamePoints(15, "Word Scramble: $correctWord")
                            score += 15
                            userInput = ""
                            currentPuzzleIndex = (currentPuzzleIndex + 1) % puzzles.size
                        } else {
                            resultMessage = "Almost there! Try rearranging the letters again. ✨"
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6B46C1))
                ) {
                    Text("Check Answer", fontWeight = FontWeight.Bold)
                }

                if (resultMessage != null) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = resultMessage!!,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if ("Awesome" in resultMessage!!) Color(0xFF059669) else Color(0xFFD97706)
                    )
                }
            }
        }
    }
}

@Composable
fun BreathingGame(viewModel: NestViewModel) {
    var isRunning by remember { mutableStateOf(true) }
    var phase by remember { mutableStateOf("Breathe In Slowly...") }

    val infiniteTransition = rememberInfiniteTransition(label = "breath_circle")
    val scale by infiniteTransition.animateFloat(
        initialValue = 0.6f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    LaunchedEffect(scale) {
        phase = if (scale > 0.95f) "Hold Gently..." else if (scale > 0.85f && scale < 1.15f) "Breathe Out Slowly..." else "Breathe In Slowly..."
    }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "4-7-8 CALMING ORB",
            fontSize = 12.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF065F46)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = phase,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF1E1B2E)
        )

        Spacer(modifier = Modifier.height(32.dp))

        Box(
            modifier = Modifier.size(240.dp),
            contentAlignment = Alignment.Center
        ) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val center = Offset(size.width / 2, size.height / 2)
                val radius = (size.width / 2.5f) * scale

                // Outer calm aura
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(Color(0x6610B981), Color.Transparent),
                        center = center,
                        radius = radius * 1.3f
                    ),
                    radius = radius * 1.3f,
                    center = center
                )

                // Main breathing sphere
                drawCircle(
                    brush = Brush.verticalGradient(
                        colors = listOf(Color(0xFFA7F3D0), Color(0xFF10B981)),
                        startY = center.y - radius,
                        endY = center.y + radius
                    ),
                    radius = radius,
                    center = center
                )
            }
            Text("🌿", fontSize = 40.sp)
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                viewModel.earnGamePoints(10, "Calm Breathing Session")
            },
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
        ) {
            Text("Complete Calm Session (+10 Sparkles ✨)", fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun MemoryMatchGame(viewModel: NestViewModel) {
    val icons = listOf("🌟", "🎈", "🚀", "🐱", "🌟", "🎈", "🚀", "🐱")
    val cards = remember { icons.shuffled() }
    var flippedIndices by remember { mutableStateOf(setOf<Int>()) }
    var matchedIndices by remember { mutableStateOf(setOf<Int>()) }
    var selectedFirst by remember { mutableStateOf<Int?>(null) }

    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "MATCH THE PAIRS",
            fontSize = 11.sp,
            fontWeight = FontWeight.Black,
            color = Color(0xFF78716C)
        )

        val rows = cards.chunked(4)
        rows.forEachIndexed { rIdx, row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                row.forEachIndexed { cIdx, emoji ->
                    val index = rIdx * 4 + cIdx
                    val isRevealed = flippedIndices.contains(index) || matchedIndices.contains(index)

                    Box(
                        modifier = Modifier
                            .size(70.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(if (isRevealed) Color(0xFFEDE9FE) else Color(0xFF6B46C1))
                            .clickable {
                                if (isRevealed || matchedIndices.contains(index)) return@clickable
                                if (selectedFirst == null) {
                                    selectedFirst = index
                                    flippedIndices = setOf(index)
                                } else {
                                    val first = selectedFirst!!
                                    if (cards[first] == cards[index]) {
                                        matchedIndices = matchedIndices + setOf(first, index)
                                        flippedIndices = emptySet()
                                        selectedFirst = null
                                        if (matchedIndices.size == cards.size) {
                                            viewModel.earnGamePoints(20, "Memory Match Champion")
                                        }
                                    } else {
                                        flippedIndices = setOf(first, index)
                                        selectedFirst = null
                                    }
                                }
                            },
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (isRevealed) emoji else "❓",
                            fontSize = 28.sp
                        )
                    }
                }
            }
        }

        if (matchedIndices.size == cards.size) {
            Card(
                shape = RoundedCornerShape(18.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFEF3C7)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("🎉 You Matched All Pairs!", fontWeight = FontWeight.Bold, color = Color(0xFF78350F))
                    Text("Earned +20 Starlight Sparkles!", fontSize = 12.sp, color = Color(0xFF92400E))
                }
            }
        }
    }
}
