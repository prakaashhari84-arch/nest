package com.example.nest

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.nest.data.model.AppUser
import com.example.nest.data.model.UserRole
import com.example.nest.ui.child.ChildMainScreen
import com.example.nest.ui.clinician.ClinicianDashboardScreen
import com.example.nest.ui.parent.ParentDashboardScreen
import com.example.nest.ui.theme.NestTheme
import com.example.nest.viewmodel.NestViewModel
import com.example.nest.viewmodel.NestViewModelFactory

class MainActivity : ComponentActivity() {
    private val viewModel: NestViewModel by viewModels {
        NestViewModelFactory((application as NestApplication).repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            NestTheme {
                val currentUser by viewModel.currentUser.collectAsState()
                val currentProfile by viewModel.currentChildProfile.collectAsState()
                var showRoleSwitcherDialog by remember { mutableStateOf(false) }

                Scaffold(
                    modifier = Modifier.fillMaxSize(),
                    topBar = {
                        TopAppBar(
                            title = {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = "🪺 Nest",
                                        fontWeight = FontWeight.Black,
                                        fontSize = 20.sp,
                                        color = Color(0xFF1E1B2E)
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(8.dp))
                                            .background(
                                                when (currentUser.role) {
                                                    UserRole.CHILD -> Color(0xFFEDE9FE)
                                                    UserRole.PARENT -> Color(0xFFFEF3C7)
                                                    UserRole.CLINICIAN -> Color(0xFFD1FAE5)
                                                }
                                            )
                                            .padding(horizontal = 8.dp, vertical = 2.dp)
                                    ) {
                                        Text(
                                            text = when (currentUser.role) {
                                                UserRole.CHILD -> "Child • ${currentUser.name}"
                                                UserRole.PARENT -> "Parent • ${currentUser.name}"
                                                UserRole.CLINICIAN -> "Clinician • ${currentUser.name}"
                                            },
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = when (currentUser.role) {
                                                UserRole.CHILD -> Color(0xFF6B46C1)
                                                UserRole.PARENT -> Color(0xFF92400E)
                                                UserRole.CLINICIAN -> Color(0xFF065F46)
                                            }
                                        )
                                    }
                                }
                            },
                            actions = {
                                Button(
                                    onClick = { showRoleSwitcherDialog = true },
                                    shape = RoundedCornerShape(12.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFEDE9FE)),
                                    contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                                ) {
                                    Icon(
                                        Icons.Default.SwapHoriz,
                                        contentDescription = "Switch Role",
                                        tint = Color(0xFF6B46C1),
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Switch Role", color = Color(0xFF6B46C1), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = Color.White
                            )
                        )
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        when (currentUser.role) {
                            UserRole.CHILD -> {
                                if (currentProfile != null) {
                                    ChildMainScreen(profile = currentProfile!!, viewModel = viewModel)
                                } else {
                                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                        CircularProgressIndicator(color = Color(0xFF6B46C1))
                                    }
                                }
                            }
                            UserRole.PARENT -> ParentDashboardScreen(user = currentUser, viewModel = viewModel)
                            UserRole.CLINICIAN -> ClinicianDashboardScreen(user = currentUser, viewModel = viewModel)
                        }
                    }

                    if (showRoleSwitcherDialog) {
                        RoleSwitcherDialog(
                            currentUser = currentUser,
                            users = viewModel.mockUsers,
                            onSelectUser = { user ->
                                viewModel.switchUser(user)
                                showRoleSwitcherDialog = false
                            },
                            onDismiss = { showRoleSwitcherDialog = false }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun RoleSwitcherDialog(
    currentUser: AppUser,
    users: List<AppUser>,
    onSelectUser: (AppUser) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = "Switch Nest Role Perspective",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E1B2E)
                )
                Text(
                    text = "Nest seamlessly connects children, caregivers, and pediatric clinicians.",
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF78716C)
                )

                Spacer(modifier = Modifier.height(4.dp))

                users.forEach { user ->
                    val isSelected = user.id == currentUser.id
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (isSelected) Color(0xFFEDE9FE) else Color(0xFFFAF8F5)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSelectUser(user) }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = when (user.role) {
                                        UserRole.CHILD -> "🧒"
                                        UserRole.PARENT -> "👨‍👩‍👧"
                                        UserRole.CLINICIAN -> "🩺"
                                    },
                                    fontSize = 24.sp
                                )
                                Spacer(modifier = Modifier.width(10.dp))
                                Column {
                                    Text(
                                        text = user.name,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = Color(0xFF1E1B2E)
                                    )
                                    Text(
                                        text = when (user.role) {
                                            UserRole.CHILD -> "Child Explorer"
                                            UserRole.PARENT -> "Caregiver Portal"
                                            UserRole.CLINICIAN -> "Supervising Clinician"
                                        },
                                        fontSize = 11.sp,
                                        color = Color(0xFF6B46C1)
                                    )
                                }
                            }

                            if (isSelected) {
                                Text("Active ✓", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color(0xFF6B46C1))
                            }
                        }
                    }
                }
            }
        }
    }
}
