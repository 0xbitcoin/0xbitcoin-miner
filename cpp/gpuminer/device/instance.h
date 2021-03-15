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

#define CL_USE_DEPRECATED_OPENCL_1_2_APIS
#define CL_USE_DEPRECATED_OPENCL_2_0_APIS

#include "adl_api.h"
#include "../types.h"

#if defined(__APPLE__) || defined(__MACOSX)
#	include <OpenCL/cl.hpp>
#else
#	include <CL/opencl.h>
#endif

namespace OpenCLSolver
{
	namespace Device
	{
		class Instance
		{
		public:
			ADL_API API;

			cl_mem MessageBuffer;
			cl_mem SolutionCountBuffer;
			cl_mem SolutionsBuffer;
			cl_mem MidStateBuffer;
			cl_mem TargetBuffer;

			cl_command_queue Queue;
			cl_context Context;
			cl_program Program;
			cl_kernel Kernel;

			cl_event KernelWaitEvent;
			cl_uint KernelWaitSleepDuration;

			cl_ulong *Solutions;
			cl_uint *SolutionCount;
		};
	}

	typedef struct Platform_t
	{
		cl_platform_id ID;
		const char *Name;
	} Platform_t;

	typedef struct DeviceCL
	{
		int Enum;
		int PciBusID;
		const char *Name;
		cl_device_id CL_ID;
		cl_device_type Type; // same as cl_ulong
		Platform_t Platform;
		bool IsAMD;
		size_t MaxWorkGroupSize;
		size_t GlobalWorkSize;
		size_t LocalWorkSize;
		float Intensity;
		cl_ulong WorkPosition;
		cl_uint MaxSolutionCount;
		cl_uint SolutionCount;
		cl_ulong *Solutions;
		Device::Instance *Instance;
	} DeviceCL;
}