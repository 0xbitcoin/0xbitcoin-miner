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

#include <algorithm>
#include <thread>
#include "cl_error.hpp"
#include "device/instance.h"

#if defined(__APPLE__) || defined(__MACOSX)
#	include <OpenCL/cl.hpp>
#else
#	include <CL/cl.hpp>
#endif

namespace OpenCLSolver
{
	class OpenCLSolver
	{
	public:
		static const char *kernelSource;
		static const char *kernelKingSource;
		static size_t kernelSourceSize;
		static size_t kernelKingSourceSize;

		static bool FoundAdlApi();
		static void PreInitialize(const char *sha3Kernel, const char *sha3KingKernel, size_t kernelSize, size_t kingKernelSize);
		static void GetPlatforms(Platform_t **platforms, cl_uint maxPlatforms, cl_uint *platformCount, const char *errorMessage);
		static void GetDevicesByPlatform(Platform_t platform, cl_uint maxDeviceCount, cl_uint *deviceCount, DeviceCL **devices, const char *errorMessage);

		OpenCLSolver() noexcept;
		~OpenCLSolver() noexcept;

		void InitializeDevice(DeviceCL *device, bool isKingMaking, const char *errorMessage);

		void PushHigh64Target(DeviceCL device, cl_ulong *high64Target, const char *errorMessage);
		void PushTarget(DeviceCL device, byte32_t *target, const char *errorMessage);
		void PushMidState(DeviceCL device, sponge_ut *midState, const char *errorMessage);
		void PushMessage(DeviceCL device, message_ut *message, const char *errorMessage);

		void Hash(DeviceCL *device, const char *errorMessage);

		void ReleaseDeviceObjects(DeviceCL *device, const char *errorMessage);

	private:
		void SetKernelArgs(DeviceCL *device, bool isKingMaking, const char *errorMessage);
	};
}