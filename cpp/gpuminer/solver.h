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

#ifndef __SOLVER__
#define __SOLVER__

#include "openCLSolver.h"

#ifdef __linux__
#	define EXPORT
#	define __CDECL__
#else
#	define EXPORT _declspec(dllexport)
#	define __CDECL__ __cdecl
#endif

namespace OpenCLSolver
{
	extern "C"
	{
		EXPORT void __CDECL__ FoundADL_API(bool *hasADL_API);

		EXPORT void __CDECL__ PreInitialize(const char *sha3Kernel, const char *sha3KingKernel, size_t kernelSize, size_t kingKernelSize);

		EXPORT void __CDECL__ GetPlatforms(Platform_t **platforms, cl_uint maxPlatforms, cl_uint *platformCount, const char *errorMessage);

		EXPORT void __CDECL__ GetDevicesByPlatform(Platform_t platform, cl_uint maxDeviceCount, cl_uint *deviceCount, DeviceCL **devices, const char *errorMessage);

		EXPORT OpenCLSolver *__CDECL__ GetInstance() noexcept;

		EXPORT void __CDECL__ DisposeInstance(OpenCLSolver *instance) noexcept;

		EXPORT void __CDECL__ InitializeDevice(OpenCLSolver *instance, DeviceCL *device, bool isKingMaking, const char *errorMessage);

		EXPORT void __CDECL__ PushHigh64Target(OpenCLSolver *instance, DeviceCL device, cl_ulong *high64Target, const char *errorMessage);

		EXPORT void __CDECL__ PushTarget(OpenCLSolver *instance, DeviceCL device, byte32_t *target, const char *errorMessage);

		EXPORT void __CDECL__ PushMidState(OpenCLSolver *instance, DeviceCL device, sponge_ut *midState, const char *errorMessage);

		EXPORT void __CDECL__ PushMessage(OpenCLSolver *instance, DeviceCL device, message_ut *message, const char *errorMessage);

		EXPORT void __CDECL__ Hash(OpenCLSolver *instance, DeviceCL *device, const char *errorMessage);

		EXPORT void __CDECL__ ReleaseDeviceObjects(OpenCLSolver *instance, DeviceCL *device, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceSettingMaxCoreClock(DeviceCL device, int *coreClock, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceSettingMaxMemoryClock(DeviceCL device, int *memoryClock, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceSettingPowerLimit(DeviceCL device, int *powerLimit, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceSettingThermalLimit(DeviceCL device, int *thermalLimit, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceSettingFanLevelPercent(DeviceCL device, int *fanLevel, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceCurrentFanTachometerRPM(DeviceCL device, int *tachometerRPM, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceCurrentTemperature(DeviceCL device, int *temperature, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceCurrentCoreClock(DeviceCL device, int *coreClock, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceCurrentMemoryClock(DeviceCL device, int *memoryClock, const char *errorMessage);

		EXPORT void __CDECL__ GetDeviceCurrentUtilizationPercent(DeviceCL device, int *utiliztion, const char *errorMessage);
	}
}

#endif // !__SOLVER__