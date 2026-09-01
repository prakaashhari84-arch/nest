package com.example.nest

import android.app.Application
import com.example.nest.data.local.NestDatabase
import com.example.nest.data.repository.NestRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob

class NestApplication : Application() {
    val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    val database by lazy { NestDatabase.getInstance(this) }
    val repository by lazy { NestRepository(database.nestDao(), applicationScope) }

    override fun onCreate() {
        super.onCreate()
    }
}
