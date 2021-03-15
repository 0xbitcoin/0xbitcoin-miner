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

#include "adl_api.h"

#ifdef __linux__ // equivalent functions in linux

const char *TEXT(const char *name)
{
	return name;
}

void *LoadLibrary(const char *name)
{
	return dlopen(name, RTLD_LAZY|RTLD_GLOBAL);
}

void *GetProcAddress(void *pLibrary, const char *name)
{
    return dlsym(pLibrary, name);
}

int FreeLibrary(void *handle)
{
	return dlclose(handle);
}

#endif

// --------------------------------------------------------------------
// Static
// --------------------------------------------------------------------

#ifdef __linux__
void *ADL_API::hDLL{ NULL };
#else
HINSTANCE ADL_API::hDLL{ NULL };
#endif

ADL_API::ADL_MAIN_CONTROL_CREATE				ADL_API::ADL_Main_Control_Create{ NULL };
ADL_API::ADL_MAIN_CONTROL_DESTROY				ADL_API::ADL_Main_Control_Destroy{ NULL };
ADL_API::ADL_ADAPTER_NUMBEROFADAPTERS_GET		ADL_API::ADL_Adapter_NumberOfAdapters_Get{ NULL };
ADL_API::ADL_ADAPTER_ADAPTERINFO_GET			ADL_API::ADL_Adapter_AdapterInfo_Get{ NULL };
ADL_API::ADL2_OVERDRIVE_CAPS					ADL_API::ADL2_Overdrive_Caps{ NULL };
ADL_API::ADL2_OVERDRIVEN_CAPABILITIES_GET		ADL_API::ADL2_OverdriveN_Capabilities_Get{ NULL };
ADL_API::ADL2_OVERDRIVEN_SYSTEMCLOCKS_GET		ADL_API::ADL2_OverdriveN_SystemClocks_Get{ NULL };
ADL_API::ADL2_OVERDRIVEN_MEMORYCLOCKS_GET		ADL_API::ADL2_OverdriveN_MemoryClocks_Get{ NULL };
ADL_API::ADL2_OVERDRIVEN_PERFORMANCESTATUS_GET	ADL_API::ADL2_OverdriveN_PerformanceStatus_Get{ NULL };
ADL_API::ADL2_OVERDRIVEN_FANCONTROL_GET			ADL_API::ADL2_OverdriveN_FanControl_Get{ NULL };
ADL_API::ADL2_OVERDRIVEN_POWERLIMIT_GET			ADL_API::ADL2_OverdriveN_PowerLimit_Get{ NULL };
ADL_API::ADL2_OVERDRIVEN_TEMPERATURE_GET		ADL_API::ADL2_OverdriveN_Temperature_Get{ NULL };

int ADL_API::numberOfAdapters{ -1 };
LPAdapterInfo ADL_API::lpAdapterInfo{ NULL };
bool ADL_API::apiFailedToLoad{ false };
bool ADL_API::isInitialized{ false };

void* __stdcall ADL_API::ADL_Main_Memory_Alloc(int iSize)
{
	void* lpBuffer = malloc(iSize);
	return lpBuffer;
}

bool ADL_API::FoundAdlApi()
{
	if (apiFailedToLoad) return false;
	return (LoadLibrary(TEXT(ADL64_API)) != NULL);
}

void ADL_API::initialize()
{
	try
	{
		hDLL = LoadLibrary(TEXT(ADL64_API));
		if (hDLL == NULL) throw std::runtime_error("Failed to initialize ADL64_API.");

		ADL_Main_Control_Create = (ADL_MAIN_CONTROL_CREATE)GetProcAddress(hDLL, "ADL_Main_Control_Create");
		ADL_Main_Control_Destroy = (ADL_MAIN_CONTROL_DESTROY)GetProcAddress(hDLL, "ADL_Main_Control_Destroy");

		if (NULL == ADL_Main_Control_Create || NULL == ADL_Main_Control_Destroy)
			throw std::runtime_error("Failed to get ADL function pointers.");

		ADL_Adapter_NumberOfAdapters_Get = (ADL_ADAPTER_NUMBEROFADAPTERS_GET)GetProcAddress(hDLL, "ADL_Adapter_NumberOfAdapters_Get");
		ADL_Adapter_AdapterInfo_Get = (ADL_ADAPTER_ADAPTERINFO_GET)GetProcAddress(hDLL, "ADL_Adapter_AdapterInfo_Get");
		ADL2_OverdriveN_Capabilities_Get = (ADL2_OVERDRIVEN_CAPABILITIES_GET)GetProcAddress(hDLL, "ADL2_OverdriveN_Capabilities_Get");
		ADL2_OverdriveN_SystemClocks_Get = (ADL2_OVERDRIVEN_SYSTEMCLOCKS_GET)GetProcAddress(hDLL, "ADL2_OverdriveN_SystemClocks_Get");
		ADL2_OverdriveN_MemoryClocks_Get = (ADL2_OVERDRIVEN_MEMORYCLOCKS_GET)GetProcAddress(hDLL, "ADL2_OverdriveN_MemoryClocks_Get");
		ADL2_OverdriveN_PerformanceStatus_Get = (ADL2_OVERDRIVEN_PERFORMANCESTATUS_GET)GetProcAddress(hDLL, "ADL2_OverdriveN_PerformanceStatus_Get");
		ADL2_OverdriveN_FanControl_Get = (ADL2_OVERDRIVEN_FANCONTROL_GET)GetProcAddress(hDLL, "ADL2_OverdriveN_FanControl_Get");
		ADL2_OverdriveN_PowerLimit_Get = (ADL2_OVERDRIVEN_POWERLIMIT_GET)GetProcAddress(hDLL, "ADL2_OverdriveN_PowerLimit_Get");
		ADL2_OverdriveN_Temperature_Get = (ADL2_OVERDRIVEN_TEMPERATURE_GET)GetProcAddress(hDLL, "ADL2_OverdriveN_Temperature_Get");
		ADL2_Overdrive_Caps = (ADL2_OVERDRIVE_CAPS)GetProcAddress(hDLL, "ADL2_Overdrive_Caps");

		if (ADL_Main_Control_Create(ADL_Main_Memory_Alloc, 1) != ADL_OK)
			throw std::runtime_error("Failed to initialize nested ADL2 context.");

		if (ADL_Adapter_NumberOfAdapters_Get(&numberOfAdapters) != ADL_OK)
			throw std::runtime_error("Cannot get the number of adapters!\n");

		if (numberOfAdapters > 0)
		{
			lpAdapterInfo = (LPAdapterInfo)malloc(sizeof(AdapterInfo) * numberOfAdapters);
			std::memset(lpAdapterInfo, 0, sizeof(AdapterInfo) * numberOfAdapters);

			ADL_Adapter_AdapterInfo_Get(lpAdapterInfo, sizeof(AdapterInfo) * numberOfAdapters);
		}
	}
	catch (...) { apiFailedToLoad = true; }
}

void ADL_API::unload()
{
	if (ADL_Main_Control_Destroy != NULL) ADL_Main_Control_Destroy();

	if (hDLL != NULL) FreeLibrary(hDLL);
}

void ADL_API::GetAdapterName(int adapterBusID, char *adapterName)
{
	if (lpAdapterInfo == NULL) return;
	try
	{
		for (int i = 0; i < numberOfAdapters; ++i)
		{
			if (lpAdapterInfo[i].iBusNumber == adapterBusID)
			{
				std::memcpy((void *)adapterName, lpAdapterInfo[i].strAdapterName, sizeof(lpAdapterInfo[i].strAdapterName));
				return;
			}
		}
	}
	catch (...)
	{
		if (apiFailedToLoad) return;
		try
		{
			if (ADL_Adapter_NumberOfAdapters_Get(&numberOfAdapters) != ADL_OK)
				throw std::runtime_error("Cannot get the number of adapters!\n");

			if (numberOfAdapters > 0)
			{
				lpAdapterInfo = (LPAdapterInfo)malloc(sizeof(AdapterInfo) * numberOfAdapters);
				std::memset(lpAdapterInfo, 0, sizeof(AdapterInfo) * numberOfAdapters);

				ADL_Adapter_AdapterInfo_Get(lpAdapterInfo, sizeof(AdapterInfo) * numberOfAdapters);
			}

			for (int i = 0; i < numberOfAdapters; ++i)
			{
				if (lpAdapterInfo[i].iBusNumber == adapterBusID)
				{
					std::memcpy((void *)adapterName, lpAdapterInfo[i].strAdapterName, sizeof(lpAdapterInfo[i].strAdapterName));
					return;
				}
			}
		}
		catch (...) {}
	}
}

// --------------------------------------------------------------------
// Private
// --------------------------------------------------------------------

bool ADL_API::checkVersion(std::string *errorMessage)
{
	*errorMessage = "";
	if (m_version == 7) return true;

	*errorMessage = "Only ADL Overdrive version 7 is supported.";
	*errorMessage += " Current version: " + std::to_string(m_version);
	return false;
}

bool ADL_API::getOverDriveNCapabilities(ADLODNCapabilities *capabilities, std::string *errorMessage)
{
	*errorMessage = "";
	if (ADL2_OverdriveN_Capabilities_Get(m_context, m_adapterInfo.iAdapterIndex, capabilities) == ADL_OK) return true;

	*errorMessage = "Failed ADL2_OverdriveN_Capabilities_Get.";
	return false;
}

// --------------------------------------------------------------------
// Public
// --------------------------------------------------------------------

void ADL_API::AssignPciBusID(uint32_t adapterBusID)
{
	m_context = NULL;
	m_enabled = 0;
	m_version = 0;
	m_supported = 0;
	this->m_adapterBusID = adapterBusID;

	if (lpAdapterInfo != NULL)
		for (int i = 0; i < numberOfAdapters; ++i)
		{
			try
			{
				if (lpAdapterInfo[i].iBusNumber == (int)adapterBusID) m_adapterInfo = lpAdapterInfo[i];
			}
			catch (...) {}
		}
	try
	{
		ADL2_Overdrive_Caps(m_context, m_adapterInfo.iAdapterIndex, &m_supported, &m_enabled, &m_version);
	}
	catch (...) {}
}

void ADL_API::GetAdapterName(std::string *adapterName)
{
	*adapterName = m_adapterInfo.strAdapterName;
}

bool ADL_API::GetSettingMaxCoreClock(int *maxCoreClock, std::string *errorMessage)
{
	*maxCoreClock = -1;

	int bufSize{ -1 };
	void* performanceLevelsBuffer{ NULL };
	ADLODNCapabilities overdriveCapabilities{ 0 };
	ADLODNPerformanceLevels *odPerformanceLevels{ NULL };

	try
	{
		if (!checkVersion(errorMessage)) return false;

		if (!getOverDriveNCapabilities(&overdriveCapabilities, errorMessage)) return false;

		bufSize = sizeof(ADLODNPerformanceLevels) + (sizeof(ADLODNPerformanceLevel) * (overdriveCapabilities.iMaximumNumberOfPerformanceLevels - 1));
		performanceLevelsBuffer = new char[bufSize];
		std::memset(performanceLevelsBuffer, 0, bufSize);

		odPerformanceLevels = (ADLODNPerformanceLevels *)performanceLevelsBuffer;
		odPerformanceLevels->iSize = bufSize;
		odPerformanceLevels->iNumberOfPerformanceLevels = overdriveCapabilities.iMaximumNumberOfPerformanceLevels;

		if (ADL2_OverdriveN_SystemClocks_Get(m_context, m_adapterInfo.iAdapterIndex, odPerformanceLevels) != ADL_OK)
		{
			*errorMessage = "Failed ADL2_OverdriveN_SystemClocks_Get.";
			free(performanceLevelsBuffer);
			return false;
		}

		for (int i = 0; i < overdriveCapabilities.iMaximumNumberOfPerformanceLevels; ++i)
			if (odPerformanceLevels->aLevels[i].iEnabled && (odPerformanceLevels->aLevels[i].iClock > *maxCoreClock))
				*maxCoreClock = odPerformanceLevels->aLevels[i].iClock;

		if (*maxCoreClock > 0) *maxCoreClock /= 100; // trim 2 decimal places

		free(performanceLevelsBuffer);
		return true;
	}
	catch (std::exception ex) { *errorMessage = ex.what(); }

	if (performanceLevelsBuffer != NULL) free(performanceLevelsBuffer);

	return false;
}

bool ADL_API::GetSettingMaxMemoryClock(int *maxMemoryClock, std::string *errorMessage)
{
	*maxMemoryClock = -1;

	int bufSize{ -1 };
	void* performanceLevelsBuffer{ NULL };
	ADLODNCapabilities overdriveCapabilities{ 0 };
	ADLODNPerformanceLevels *odPerformanceLevels{ NULL };

	try
	{
		if (!checkVersion(errorMessage)) return false;

		if (!getOverDriveNCapabilities(&overdriveCapabilities, errorMessage)) return false;

		bufSize = sizeof(ADLODNPerformanceLevels) + (sizeof(ADLODNPerformanceLevel) * (overdriveCapabilities.iMaximumNumberOfPerformanceLevels - 1));
		performanceLevelsBuffer = new char[bufSize];
		std::memset(performanceLevelsBuffer, 0, bufSize);

		odPerformanceLevels = (ADLODNPerformanceLevels *)performanceLevelsBuffer;
		odPerformanceLevels->iSize = bufSize;
		odPerformanceLevels->iMode = 0; // current
		odPerformanceLevels->iNumberOfPerformanceLevels = overdriveCapabilities.iMaximumNumberOfPerformanceLevels;

		if (ADL2_OverdriveN_MemoryClocks_Get(m_context, m_adapterInfo.iAdapterIndex, odPerformanceLevels) != ADL_OK)
		{
			*errorMessage = "Failed ADL2_OverdriveN_MemoryClocks_Get.";
			free(performanceLevelsBuffer);
			return false;
		}

		for (int i = 0; i < overdriveCapabilities.iMaximumNumberOfPerformanceLevels; ++i)
			if (odPerformanceLevels->aLevels[i].iEnabled && (odPerformanceLevels->aLevels[i].iClock > *maxMemoryClock))
				*maxMemoryClock = odPerformanceLevels->aLevels[i].iClock;

		if (*maxMemoryClock > 0) *maxMemoryClock /= 100; // remove 2 decimal places

		free(performanceLevelsBuffer);
		return true;
	}
	catch (std::exception ex) { *errorMessage = ex.what(); }

	if (performanceLevelsBuffer != NULL) free(performanceLevelsBuffer);

	return false;
}

bool ADL_API::GetSettingPowerLimit(int *powerLimit, std::string *errorMessage)
{
	*powerLimit = INT32_MIN;

	ADLODNPowerLimitSetting odNPowerControl{ 0 };

	if (!checkVersion(errorMessage)) return false;

	if (ADL2_OverdriveN_PowerLimit_Get(m_context, m_adapterInfo.iAdapterIndex, &odNPowerControl) == ADL_OK)
	{
		*powerLimit = odNPowerControl.iTDPLimit;
		return true;
	}

	*errorMessage = "Failed ADL2_OverdriveN_PowerLimit_Get";
	return false;
}

bool ADL_API::GetSettingThermalLimit(int *thermalLimit, std::string *errorMessage)
{
	*thermalLimit = INT32_MIN;

	ADLODNPowerLimitSetting odNPowerControl{ 0 };

	if (!checkVersion(errorMessage)) return false;

	if (ADL2_OverdriveN_PowerLimit_Get(m_context, m_adapterInfo.iAdapterIndex, &odNPowerControl) == ADL_OK)
	{
		*thermalLimit = odNPowerControl.iMaxOperatingTemperature;
		return true;
	}

	*errorMessage = "Failed ADL2_OverdriveN_PowerLimit_Get";
	return false;
}

bool ADL_API::GetSettingFanLevelPercent(int *fanLevel, std::string *errorMessage)
{
	*fanLevel = -1;

	ADLODNCapabilities overdriveCapabilities{ 0 };
	ADLODNFanControl odNFanControl{ 0 };

	if (!checkVersion(errorMessage)) return false;

	if (!getOverDriveNCapabilities(&overdriveCapabilities, errorMessage)) return false;

	if (ADL2_OverdriveN_FanControl_Get(m_context, m_adapterInfo.iAdapterIndex, &odNFanControl) == ADL_OK)
	{
		const int stepCount = overdriveCapabilities.fanSpeed.iMax - overdriveCapabilities.fanSpeed.iMin;
		*fanLevel = (int)((double)odNFanControl.iTargetFanSpeed / stepCount * 100);
		return true;
	}

	*errorMessage = "Failed ADL2_OverdriveN_FanControl_Get";
	return false;
}

bool ADL_API::GetCurrentFanTachometerRPM(int *tachometerRPM, std::string *errorMessage)
{
	*tachometerRPM = -1;

	ADLODNFanControl odNFanControl{ 0 };

	if (!checkVersion(errorMessage)) return false;

	if (ADL2_OverdriveN_FanControl_Get(m_context, m_adapterInfo.iAdapterIndex, &odNFanControl) == ADL_OK)
	{
		*tachometerRPM = odNFanControl.iCurrentFanSpeed;
		return true;
	}

	*errorMessage = "Failed ADL2_OverdriveN_FanControl_Get";
	return false;
}

bool ADL_API::GetCurrentTemperature(int *temperature, std::string *errorMessage)
{
	*temperature = INT32_MIN;
	int tempTemperature{ 0 };

	if (ADL2_OverdriveN_Temperature_Get(m_context, m_adapterInfo.iAdapterIndex, 1, &tempTemperature) == ADL_OK)
	{
		*temperature = tempTemperature / 1000;
		return true;
	}

	*errorMessage = "Failed ADL2_OverdriveN_PowerLimit_Get";
	return false;
}

bool ADL_API::GetCurrentCoreClock(int *coreClock, std::string *errorMessage)
{
	*coreClock = -1;

	ADLODNPerformanceStatus odNPerformanceStatus{ 0 };

	if (ADL2_OverdriveN_PerformanceStatus_Get(m_context, m_adapterInfo.iAdapterIndex, &odNPerformanceStatus) == ADL_OK)
	{
		*coreClock = odNPerformanceStatus.iCoreClock / 100; // trim 2 decimal places
		return true;
	}

	*errorMessage = "Failed ADL2_OverdriveN_PerformanceStatus_Get";
	return false;
}

bool ADL_API::GetCurrentMemoryClock(int *memoryClock, std::string *errorMessage)
{
	*memoryClock = -1;

	ADLODNPerformanceStatus odNPerformanceStatus{ 0 };

	if (ADL2_OverdriveN_PerformanceStatus_Get(m_context, m_adapterInfo.iAdapterIndex, &odNPerformanceStatus) == ADL_OK)
	{
		*memoryClock = odNPerformanceStatus.iMemoryClock / 100; // trim 2 decimal places
		return true;
	}

	*errorMessage = "Failed ADL2_OverdriveN_PerformanceStatus_Get";
	return false;
}

bool ADL_API::GetCurrentUtilizationPercent(int *utilization, std::string *errorMessage)
{
	*utilization = -1;

	ADLODNPerformanceStatus odNPerformanceStatus{ 0 };

	if (ADL2_OverdriveN_PerformanceStatus_Get(m_context, m_adapterInfo.iAdapterIndex, &odNPerformanceStatus) == ADL_OK)
	{
		*utilization = odNPerformanceStatus.iGPUActivityPercent;
		return true;
	}

	*errorMessage = "Failed ADL2_OverdriveN_PerformanceStatus_Get";
	return false;
}