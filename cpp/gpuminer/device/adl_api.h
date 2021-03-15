/*
   Copyright 2018 Lip Wee Yeo Amano
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
	   http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

#pragma once

#ifdef __linux__
#	ifndef LINUX
#		define LINUX
#	endif
#	include <dlfcn.h>
#	define ADL64_API									"libatiadlxx.so"
#else
#include <Windows.h>
#	define ADL64_API									"atiadlxx.dll"
#endif

#include <cstring>
#include <stdexcept>
#include <string>
#include "adl_include/adl_sdk.h"

class ADL_API
{
private:
	typedef int(*ADL_MAIN_CONTROL_CREATE)				(ADL_MAIN_MALLOC_CALLBACK, int);
	typedef int(*ADL_MAIN_CONTROL_DESTROY)				();

	typedef int(*ADL_ADAPTER_NUMBEROFADAPTERS_GET)		(int*);
	typedef int(*ADL_ADAPTER_ADAPTERINFO_GET)			(LPAdapterInfo, int);
	typedef int(*ADL2_OVERDRIVE_CAPS)					(ADL_CONTEXT_HANDLE context, int iAdapterIndex, int *iSupported, int *iEnabled, int *iVersion);
	typedef int(*ADL2_OVERDRIVEN_CAPABILITIES_GET)		(ADL_CONTEXT_HANDLE, int, ADLODNCapabilities *);
	typedef int(*ADL2_OVERDRIVEN_SYSTEMCLOCKS_GET)		(ADL_CONTEXT_HANDLE, int, ADLODNPerformanceLevels *);
	typedef int(*ADL2_OVERDRIVEN_MEMORYCLOCKS_GET)		(ADL_CONTEXT_HANDLE, int, ADLODNPerformanceLevels *);
	typedef int(*ADL2_OVERDRIVEN_PERFORMANCESTATUS_GET)	(ADL_CONTEXT_HANDLE, int, ADLODNPerformanceStatus *);
	typedef int(*ADL2_OVERDRIVEN_FANCONTROL_GET)		(ADL_CONTEXT_HANDLE, int, ADLODNFanControl *);
	typedef int(*ADL2_OVERDRIVEN_POWERLIMIT_GET)		(ADL_CONTEXT_HANDLE, int, ADLODNPowerLimitSetting *);
	typedef int(*ADL2_OVERDRIVEN_TEMPERATURE_GET)		(ADL_CONTEXT_HANDLE, int, int, int *);

	#ifdef __linux__
	static void											*hDLL;
	#else
	static HINSTANCE									hDLL;
	#endif

	static ADL_MAIN_CONTROL_CREATE						ADL_Main_Control_Create;
	static ADL_MAIN_CONTROL_DESTROY						ADL_Main_Control_Destroy;
	static ADL_ADAPTER_NUMBEROFADAPTERS_GET				ADL_Adapter_NumberOfAdapters_Get;
	static ADL_ADAPTER_ADAPTERINFO_GET					ADL_Adapter_AdapterInfo_Get;
	static ADL2_OVERDRIVE_CAPS							ADL2_Overdrive_Caps;
	static ADL2_OVERDRIVEN_CAPABILITIES_GET				ADL2_OverdriveN_Capabilities_Get;
	static ADL2_OVERDRIVEN_SYSTEMCLOCKS_GET				ADL2_OverdriveN_SystemClocks_Get;
	static ADL2_OVERDRIVEN_MEMORYCLOCKS_GET				ADL2_OverdriveN_MemoryClocks_Get;
	static ADL2_OVERDRIVEN_PERFORMANCESTATUS_GET		ADL2_OverdriveN_PerformanceStatus_Get;
	static ADL2_OVERDRIVEN_FANCONTROL_GET				ADL2_OverdriveN_FanControl_Get;
	static ADL2_OVERDRIVEN_POWERLIMIT_GET				ADL2_OverdriveN_PowerLimit_Get;
	static ADL2_OVERDRIVEN_TEMPERATURE_GET				ADL2_OverdriveN_Temperature_Get;

	static int											numberOfAdapters;
	static LPAdapterInfo								lpAdapterInfo;
	static bool											apiFailedToLoad;

	static void* __stdcall								ADL_Main_Memory_Alloc(int iSize);	// Memory allocation function

	uint32_t m_adapterBusID;
	AdapterInfo m_adapterInfo;

	ADL_CONTEXT_HANDLE m_context;
	int m_supported;
	int m_enabled;
	int m_version;

	bool checkVersion(std::string *errorMessage);
	bool getOverDriveNCapabilities(ADLODNCapabilities *capabilities, std::string *errorMessage);

public:
	static bool isInitialized;

	static bool FoundAdlApi();
	static void initialize();
	static void unload();
	static void GetAdapterName(int adapterBusID, char *adapterName);

	void AssignPciBusID(uint32_t adapterBusID);
	void GetAdapterName(std::string *adapterName);

	bool GetSettingMaxCoreClock(int *maxCoreClock, std::string *errorMessage);
	bool GetSettingMaxMemoryClock(int *maxMemoryClock, std::string *errorMessage);
	bool GetSettingPowerLimit(int *powerLimit, std::string *errorMessage);
	bool GetSettingThermalLimit(int *thermalLimit, std::string *errorMessage);
	bool GetSettingFanLevelPercent(int *fanLevel, std::string *errorMessage);

	bool GetCurrentFanTachometerRPM(int *tachometerRPM, std::string *errorMessage);
	bool GetCurrentTemperature(int *temperature, std::string *errorMessage);
	bool GetCurrentCoreClock(int *coreClock, std::string *errorMessage);
	bool GetCurrentMemoryClock(int *memoryClock, std::string *errorMessage);
	bool GetCurrentUtilizationPercent(int *utilization, std::string *errorMessage);
};