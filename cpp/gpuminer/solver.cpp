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

#include "solver.h"

namespace OpenCLSolver
{
	void FoundADL_API(bool *hasADL_API)
	{
		*hasADL_API = OpenCLSolver::FoundAdlApi();
	}

	void PreInitialize(const char *sha3Kernel, const char *sha3KingKernel, size_t kernelSize, size_t kingKernelSize)
	{
		OpenCLSolver::PreInitialize(sha3Kernel, sha3KingKernel, kernelSize, kingKernelSize);
	}

	void GetPlatforms(Platform_t **platforms, cl_uint maxPlatforms, cl_uint *platformCount, const char *errorMessage)
	{
		OpenCLSolver::GetPlatforms(platforms, maxPlatforms, platformCount, errorMessage);
	}

	void GetDevicesByPlatform(Platform_t platform, cl_uint maxDeviceCount, cl_uint *deviceCount, DeviceCL **devices, const char *errorMessage)
	{
		OpenCLSolver::GetDevicesByPlatform(platform, maxDeviceCount, deviceCount, devices, errorMessage);
	}

	OpenCLSolver *GetInstance() noexcept
	{
		return new OpenCLSolver();
	}

	void DisposeInstance(OpenCLSolver *instance) noexcept
	{
		delete instance;
	}

	void InitializeDevice(OpenCLSolver *instance, DeviceCL *device, bool isKingMaking, const char *errorMessage)
	{
		instance->InitializeDevice(device, isKingMaking, errorMessage);
	}

	void PushHigh64Target(OpenCLSolver *instance, DeviceCL device, cl_ulong *high64Target, const char *errorMessage)
	{
		instance->PushHigh64Target(device, high64Target, errorMessage);
	}

	void PushTarget(OpenCLSolver *instance, DeviceCL device, byte32_t *target, const char *errorMessage)
	{
		instance->PushTarget(device, target, errorMessage);
	}

	void PushMidState(OpenCLSolver *instance, DeviceCL device, sponge_ut *midState, const char *errorMessage)
	{
		instance->PushMidState(device, midState, errorMessage);
	}

	void PushMessage(OpenCLSolver *instance, DeviceCL device, message_ut *message, const char *errorMessage)
	{
		instance->PushMessage(device, message, errorMessage);
	}

	void Hash(OpenCLSolver *instance, DeviceCL *device, const char *errorMessage)
	{
		instance->Hash(device, errorMessage);
	}

	void ReleaseDeviceObjects(OpenCLSolver *instance, DeviceCL *device, const char *errorMessage)
	{
		instance->ReleaseDeviceObjects(device, errorMessage);
	}

	void GetDeviceSettingMaxCoreClock(DeviceCL device, int *coreClock, const char *errorMessage)
	{
		*coreClock = -1;
		std::string errorMsg;
		device.Instance->API.GetSettingMaxCoreClock(coreClock, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceSettingMaxMemoryClock(DeviceCL device, int *memoryClock, const char *errorMessage)
	{
		*memoryClock = -1;
		std::string errorMsg;
		device.Instance->API.GetSettingMaxMemoryClock(memoryClock, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceSettingPowerLimit(DeviceCL device, int *powerLimit, const char *errorMessage)
	{
		*powerLimit = -1;
		std::string errorMsg;
		device.Instance->API.GetSettingPowerLimit(powerLimit, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceSettingThermalLimit(DeviceCL device, int *thermalLimit, const char *errorMessage)
	{
		*thermalLimit = INT32_MIN;
		std::string errorMsg;
		device.Instance->API.GetSettingThermalLimit(thermalLimit, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceSettingFanLevelPercent(DeviceCL device, int *fanLevel, const char *errorMessage)
	{
		*fanLevel = -1;
		std::string errorMsg;
		device.Instance->API.GetSettingFanLevelPercent(fanLevel, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceCurrentFanTachometerRPM(DeviceCL device, int *tachometerRPM, const char *errorMessage)
	{
		*tachometerRPM = -1;
		std::string errorMsg;
		device.Instance->API.GetCurrentFanTachometerRPM(tachometerRPM, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceCurrentTemperature(DeviceCL device, int *temperature, const char *errorMessage)
	{
		*temperature = INT32_MIN;
		std::string errorMsg;
		device.Instance->API.GetCurrentTemperature(temperature, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceCurrentCoreClock(DeviceCL device, int *coreClock, const char *errorMessage)
	{
		*coreClock = -1;
		std::string errorMsg;
		device.Instance->API.GetCurrentCoreClock(coreClock, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceCurrentMemoryClock(DeviceCL device, int *memoryClock, const char *errorMessage)
	{
		*memoryClock = -1;
		std::string errorMsg;
		device.Instance->API.GetCurrentMemoryClock(memoryClock, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}

	void GetDeviceCurrentUtilizationPercent(DeviceCL device, int *utiliztion, const char *errorMessage)
	{
		*utiliztion = -1;
		std::string errorMsg;
		device.Instance->API.GetCurrentUtilizationPercent(utiliztion, &errorMsg);

		auto errorChar = errorMsg.c_str();
		std::memcpy((void *)errorMessage, errorChar, errorMsg.length());
		std::memset((void *)&errorMessage[errorMsg.length()], 0, 1);
	}
}