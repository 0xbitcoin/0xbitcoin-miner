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

#include "openCLSolver.h"

namespace OpenCLSolver
{
	// --------------------------------------------------------------------
	// Static
	// --------------------------------------------------------------------

	const char *OpenCLSolver::kernelSource;
	const char *OpenCLSolver::kernelKingSource;
	size_t OpenCLSolver::kernelSourceSize;
	size_t OpenCLSolver::kernelKingSourceSize;

	bool OpenCLSolver::FoundAdlApi()
	{
		return ADL_API::FoundAdlApi();
	}

	void OpenCLSolver::PreInitialize(const char *sha3Kernel, const char *sha3KingKernel, size_t kernelSize, size_t kingKernelSize)
	{
		if (kernelSize > 0)
		{
			kernelSource = new char[kernelSize];
			std::memcpy((void *)kernelSource, sha3Kernel, kernelSize);
			std::memset((void *)&kernelSource[kernelSize], 0, 1);
		}

		if (kingKernelSize > 0)
		{
			kernelKingSource = new char[kingKernelSize];
			std::memcpy((void *)kernelKingSource, sha3KingKernel, kingKernelSize);
			std::memset((void *)&kernelKingSource[kingKernelSize], 0, 1);
		}

		kernelSourceSize = kernelSize;
		kernelKingSourceSize = kingKernelSize;

		if (ADL_API::FoundAdlApi())
			ADL_API::initialize();
	}

	void OpenCLSolver::GetPlatforms(Platform_t **platforms, cl_uint maxPlatforms, cl_uint *platformCount, const char *errorMessage)
	{
		cl_int status{ CL_SUCCESS };

		status = clGetPlatformIDs(0, NULL, platformCount);
		if (status != CL_SUCCESS)
		{
			auto msg = "No OpenCL platforms available.";
			std::string msgString{ msg };
			std::memcpy((void *)errorMessage, msg, msgString.length());
			std::memset((void *)&errorMessage[msgString.length()], 0, 1);
			return;
		}

		if (*platformCount > maxPlatforms)
			*platformCount = maxPlatforms;

		cl_platform_id *tempPlatforms = (cl_platform_id *)malloc(*platformCount * sizeof(cl_platform_id));
		status = clGetPlatformIDs(*platformCount, tempPlatforms, 0);
		if (status != CL_SUCCESS)
		{
			auto msg = "Failed to get OpenCL platforms.";
			std::string msgString{ msg };
			std::memcpy((void *)errorMessage, msg, msgString.length());
			std::memset((void *)&errorMessage[msgString.length()], 0, 1);
			return;
		}

		*platforms = new Platform_t[*platformCount];

		for (int i{ 0 }; i < *platformCount; ++i)
		{
			char platformNameBuf[256];
			status = clGetPlatformInfo(tempPlatforms[i], CL_PLATFORM_NAME, sizeof(platformNameBuf), platformNameBuf, 0);
			std::string platformName{ (std::string{ platformNameBuf } == "") ? "Unknown" : platformNameBuf };
			auto platformNameChar = platformName.c_str();

			(*platforms)[i].ID = tempPlatforms[i];

			(*platforms)[i].Name = new char[256];
			std::memcpy((void *)(*platforms)[i].Name, platformNameChar, platformName.length());
			std::memset((void *)&(*platforms)[i].Name[platformName.length()], 0, 1);
		}
	}

	void OpenCLSolver::GetDevicesByPlatform(Platform_t platform, cl_uint maxDeviceCount, cl_uint *deviceCount, DeviceCL **devices, const char *errorMessage)
	{
		if (!CL_Error::CheckError(
			clGetDeviceIDs(platform.ID, CL_DEVICE_TYPE_GPU, 0, NULL, deviceCount)
			, errorMessage
			, (std::string{ "Unable to get device count for " } + platform.Name).c_str()))
			return;

		if (*deviceCount > maxDeviceCount)
			*deviceCount = maxDeviceCount;

		cl_device_id* deviceIDs = new cl_device_id[*deviceCount];

		if (!CL_Error::CheckError(
			clGetDeviceIDs(platform.ID, CL_DEVICE_TYPE_GPU, *deviceCount, deviceIDs, 0)
			, errorMessage
			, (std::string{ "Unable to get device ID for " } + platform.Name).c_str()))
			return;

		*devices = new DeviceCL[*deviceCount];

		for (int i{ 0 }; i < *deviceCount; ++i)
		{
			(*devices)[i].Enum = i;
			(*devices)[i].PciBusID = -1;
			(*devices)[i].CL_ID = deviceIDs[i];
			(*devices)[i].Platform = platform;
			(*devices)[i].Type = CL_DEVICE_TYPE_GPU;

			(*devices)[i].Name = new char[256];
			std::memset((void *)(*devices)[i].Name, 0, 256);

			if (!CL_Error::CheckError(
				clGetDeviceInfo((*devices)[i].CL_ID, CL_DEVICE_NAME, 256, (void *)(*devices)[i].Name, 0)
				, errorMessage
				, (std::string{ "Failed to get " } + platform.Name + " CL_DEVICE_NAME").c_str()))
				return;

			if (!CL_Error::CheckError(
				clGetDeviceInfo((*devices)[i].CL_ID, CL_DEVICE_MAX_WORK_GROUP_SIZE, sizeof((*devices)[i].MaxWorkGroupSize), &(*devices)[i].MaxWorkGroupSize, 0)
				, errorMessage
				, (std::string{ "Failed to get " } + platform.Name + " CL_DEVICE_MAX_WORK_GROUP_SIZE").c_str()))
				return;

			std::string platformName{ (*devices)[i].Platform.Name };
			std::transform(platformName.begin(), platformName.end(), platformName.begin(), ::toupper);
			(*devices)[i].IsAMD = platformName.find("ACCELERATED PARALLEL PROCESSING") != std::string::npos;

			if ((*devices)[i].IsAMD)
			{
				cl_device_topology_amd topology;

				if (!CL_Error::CheckError(clGetDeviceInfo((*devices)[i].CL_ID, CL_DEVICE_TOPOLOGY_AMD, sizeof(cl_device_topology_amd), &topology, 0), errorMessage))
					return;
				else
					if (topology.raw.type == CL_DEVICE_TOPOLOGY_TYPE_PCIE_AMD)
					{
						(*devices)[i].PciBusID = topology.pcie.bus;

						if (ADL_API::FoundAdlApi())
						{
							std::memset((void *)(*devices)[i].Name, 0, 256);
							ADL_API::GetAdapterName((*devices)[i].PciBusID, (char *)(*devices)[i].Name);
						}
					}
			}
		}
	}

	// --------------------------------------------------------------------
	// Public
	// --------------------------------------------------------------------

	OpenCLSolver::OpenCLSolver() noexcept
	{ }

	OpenCLSolver::~OpenCLSolver() noexcept
	{
		ADL_API::unload();
	}

	void OpenCLSolver::InitializeDevice(DeviceCL *device, bool isKingMaking, const char *errorMessage)
	{
		cl_int status{ CL_SUCCESS };

		device->Instance = new Device::Instance();

		if (device->IsAMD)
			if (ADL_API::FoundAdlApi())
				device->Instance->API.AssignPciBusID(device->PciBusID);

		device->Instance->KernelWaitSleepDuration = 1000u;

		auto userTotalWorkSize = (size_t)std::pow(2, device->Intensity);
		device->GlobalWorkSize = (size_t)(userTotalWorkSize / device->LocalWorkSize) * (device->LocalWorkSize); // in multiples of localWorkSize

		cl_context_properties contextProp[] = { CL_CONTEXT_PLATFORM, (cl_context_properties)device->Platform.ID, 0 };

		device->Instance->Context = clCreateContext(contextProp, 1, &device->CL_ID, NULL, NULL, &status);

		if (!CL_Error::CheckError(status, errorMessage, "Failed to create context"))
			return;

		device->Instance->Queue = clCreateCommandQueueWithProperties(device->Instance->Context, device->CL_ID, 0, &status);

		if (!CL_Error::CheckError(status, errorMessage, "Failed to create command queue"))
			return;

		device->Instance->Solutions = (cl_ulong *)malloc(UINT64_LENGTH * device->MaxSolutionCount);
		std::memset(device->Instance->Solutions, 0, UINT64_LENGTH * device->MaxSolutionCount);

		device->Instance->SolutionsBuffer =
			clCreateBuffer(device->Instance->Context, CL_MEM_READ_WRITE | CL_MEM_USE_HOST_PTR, UINT64_LENGTH * device->MaxSolutionCount, device->Instance->Solutions, &status);

		if (!CL_Error::CheckError(status, errorMessage, "Failed to create solutions buffer"))
			return;

		device->Instance->SolutionCount = (cl_uint *)malloc(UINT32_LENGTH);
		std::memset(device->Instance->SolutionCount, 0, UINT32_LENGTH);

		device->Instance->SolutionCountBuffer = clCreateBuffer(device->Instance->Context, CL_MEM_READ_WRITE | CL_MEM_USE_HOST_PTR, UINT32_LENGTH, device->Instance->SolutionCount, &status);

		if (!CL_Error::CheckError(status, errorMessage, "Failed to create solution count buffer"))
			return;

		std::string newSource;
		char *kernelEntryName;

		if (isKingMaking)
		{
			newSource = kernelKingSource;
			kernelEntryName = (char *)"hashMessage";

			device->Instance->MessageBuffer = clCreateBuffer(device->Instance->Context, CL_MEM_READ_ONLY, MESSAGE_LENGTH, NULL, &status);
			if (!CL_Error::CheckError(status, errorMessage, "Failed to allocate message buffer"))
				return;

			device->Instance->TargetBuffer = clCreateBuffer(device->Instance->Context, CL_MEM_READ_ONLY, UINT256_LENGTH, NULL, &status);
			if (!CL_Error::CheckError(status, errorMessage, "Failed to allocate target buffer"))
				return;
		}
		else
		{
			newSource = kernelSource;
			kernelEntryName = (char *)"hashMidstate";

			device->Instance->MidStateBuffer = clCreateBuffer(device->Instance->Context, CL_MEM_READ_ONLY, SPONGE_LENGTH, NULL, &status);
			if (!CL_Error::CheckError(status, errorMessage, "Failed to allocate midstate buffer"))
				return;

			device->Instance->TargetBuffer = clCreateBuffer(device->Instance->Context, CL_MEM_READ_ONLY, UINT64_LENGTH, NULL, &status);
			if (!CL_Error::CheckError(status, errorMessage, "Failed to allocate target buffer"))
				return;
		}

		if (device->IsAMD)
			newSource.insert(0, "#define PLATFORM 2\n");

		const char *tempSouce = newSource.c_str();
		size_t tempSize = newSource.size();

		device->Instance->Program = clCreateProgramWithSource(device->Instance->Context, 1, &tempSouce, (size_t *)&tempSize, &status);
		if (!CL_Error::CheckError(status, errorMessage, "Failed to create program"))
			return;

		status = clBuildProgram(device->Instance->Program, 1, &device->CL_ID, NULL, NULL, NULL);
		if (status != CL_SUCCESS)
		{
			size_t logSize;
			clGetProgramBuildInfo(device->Instance->Program, device->CL_ID, CL_PROGRAM_BUILD_LOG, 0, NULL, &logSize);

			char *log = (char *)malloc(logSize);
			clGetProgramBuildInfo(device->Instance->Program, device->CL_ID, CL_PROGRAM_BUILD_LOG, logSize, log, NULL);

			CL_Error::CheckError(status, errorMessage, "Failed to build program", log);
			return;
		}

		device->Instance->Kernel = clCreateKernel(device->Instance->Program, kernelEntryName, &status);
		if (!CL_Error::CheckError(status, errorMessage, "Failed to create kernel from program"))
			return;

		SetKernelArgs(device, isKingMaking, errorMessage);
	}

	void OpenCLSolver::PushHigh64Target(DeviceCL device, cl_ulong *high64Target, const char *errorMessage)
	{
		CL_Error::CheckError(
			clEnqueueWriteBuffer(device.Instance->Queue, device.Instance->TargetBuffer, CL_TRUE, 0, UINT64_LENGTH, high64Target, 0, NULL, NULL)
			, errorMessage
			, "Error writing to target buffer: ");
	}

	void OpenCLSolver::PushTarget(DeviceCL device, byte32_t *target, const char *errorMessage)
	{
		CL_Error::CheckError(
			clEnqueueWriteBuffer(device.Instance->Queue, device.Instance->TargetBuffer, CL_TRUE, 0, UINT256_LENGTH, target, 0, NULL, NULL)
			, errorMessage
			, "Error writing to target buffer: ");
	}

	void OpenCLSolver::PushMidState(DeviceCL device, sponge_ut *midState, const char *errorMessage)
	{
		CL_Error::CheckError(
			clEnqueueWriteBuffer(device.Instance->Queue, device.Instance->MidStateBuffer, CL_TRUE, 0, SPONGE_LENGTH, midState, 0, NULL, NULL)
			, errorMessage
			, "Error writing to midstate buffer: ");
	}

	void OpenCLSolver::PushMessage(DeviceCL device, message_ut *message, const char *errorMessage)
	{
		CL_Error::CheckError(
			clEnqueueWriteBuffer(device.Instance->Queue, device.Instance->MessageBuffer, CL_TRUE, 0, MESSAGE_LENGTH, message, 0, NULL, NULL)
			, errorMessage
			, "Error writing to message buffer: ");
	}

	void OpenCLSolver::Hash(DeviceCL *device, const char *errorMessage)
	{
		cl_int status{ CL_SUCCESS };

		if (!CL_Error::CheckError(
			clSetKernelArg(device->Instance->Kernel, 2, UINT64_LENGTH, &device->WorkPosition)
			, "Error setting work positon buffer to kernel"))
			return;

		if (!CL_Error::CheckError(
				clEnqueueNDRangeKernel(
					device->Instance->Queue, device->Instance->Kernel, 1, NULL, &device->GlobalWorkSize, &device->LocalWorkSize, 0, NULL, &device->Instance->KernelWaitEvent)
				, "Error starting kernel"))
			return;

		if (!device->IsAMD) // Intel 100% CPU workaround
		{
			cl_uint waitStatus{ CL_QUEUED }, waitKernelCount{ 0 };
			while (waitStatus != CL_COMPLETE)
			{
				std::this_thread::sleep_for(std::chrono::microseconds(device->Instance->KernelWaitSleepDuration));
				waitKernelCount++;

				if (!CL_Error::CheckError(
						clGetEventInfo(device->Instance->KernelWaitEvent, CL_EVENT_COMMAND_EXECUTION_STATUS, UINT32_LENGTH, &waitStatus, 0)
						, "Error getting event info"))
					return;
			}

			// hysteresis required to avoid constant changing of kernelWaitSleepDuration that will waste CPU cycles/hashrates
			if (waitKernelCount > 15) device->Instance->KernelWaitSleepDuration++;
			else if (waitKernelCount < 5 && device->Instance->KernelWaitSleepDuration > 0) device->Instance->KernelWaitSleepDuration--;
		}

		device->Instance->SolutionCount =
			(cl_uint *)clEnqueueMapBuffer(device->Instance->Queue, device->Instance->SolutionCountBuffer, CL_TRUE, CL_MAP_READ, 0, UINT32_LENGTH, 0, NULL, NULL, &status);
		if (!CL_Error::CheckError(status, "Error getting solution count from device"))
			return;

		if (*device->Instance->SolutionCount > 0)
		{
			device->SolutionCount = *device->Instance->SolutionCount;

			device->Instance->Solutions =
				(cl_ulong *)clEnqueueMapBuffer(
					device->Instance->Queue, device->Instance->SolutionsBuffer, CL_TRUE, CL_MAP_READ | CL_MAP_WRITE, 0, UINT64_LENGTH * device->MaxSolutionCount, 0, NULL, NULL, &status);
			if (!CL_Error::CheckError(status, "Error getting solutions from device"))
				return;

			for (int i = 0; i < device->SolutionCount; ++i)
				device->Solutions[i] = device->Instance->Solutions[i];

			if (!CL_Error::CheckError(
				clEnqueueUnmapMemObject(device->Instance->Queue, device->Instance->SolutionsBuffer, device->Instance->Solutions, 0, NULL, NULL)
				, "Error unmapping solutions from host"))
				return;

			if (!CL_Error::CheckError(
				clEnqueueUnmapMemObject(device->Instance->Queue, device->Instance->SolutionCountBuffer, device->Instance->SolutionCount, 0, NULL, NULL)
				, "Error unmapping solution count from host"))
				return;

			device->Instance->SolutionCount =
				(cl_uint *)clEnqueueMapBuffer(device->Instance->Queue, device->Instance->SolutionCountBuffer, CL_TRUE, CL_MAP_READ | CL_MAP_WRITE, 0, UINT32_LENGTH, 0, NULL, NULL, &status);
			if (!CL_Error::CheckError(status, "Error getting solution count from device"))
				return;

			*device->Instance->SolutionCount = 0;
		}

		if (!CL_Error::CheckError(
			clEnqueueUnmapMemObject(device->Instance->Queue, device->Instance->SolutionCountBuffer, device->Instance->SolutionCount, 0, NULL, NULL)
			, "Error unmapping solution count from host"))
			return;
	}

	void OpenCLSolver::ReleaseDeviceObjects(DeviceCL *device, const char *errorMessage)
	{
		if (!CL_Error::CheckError(clReleaseKernel(device->Instance->Kernel), errorMessage))
			return;

		if (!CL_Error::CheckError(clReleaseProgram(device->Instance->Program), errorMessage))
			return;

		if (!CL_Error::CheckError(clReleaseMemObject(device->Instance->SolutionsBuffer), errorMessage))
			return;

		if (!CL_Error::CheckError(clReleaseMemObject(device->Instance->MidStateBuffer), errorMessage))
			return;

		if (!CL_Error::CheckError(clReleaseCommandQueue(device->Instance->Queue), errorMessage))
			return;

		if (!CL_Error::CheckError(clReleaseContext(device->Instance->Context), errorMessage))
			return;
	}

	void OpenCLSolver::SetKernelArgs(DeviceCL *device, bool isKingMaking, const char *errorMessage)
	{
		if (isKingMaking)
		{
			if (!CL_Error::CheckError(clSetKernelArg(device->Instance->Kernel, 0, sizeof(cl_mem), &device->Instance->MessageBuffer)
				, errorMessage
				, "Error setting message buffer to kernel"))
				return;
		}
		else
		{
			if (!CL_Error::CheckError(clSetKernelArg(device->Instance->Kernel, 0, sizeof(cl_mem), &device->Instance->MidStateBuffer)
				, errorMessage
				, "Error setting midsate buffer to kernel"))
				return;
		}

		if (!CL_Error::CheckError(clSetKernelArg(device->Instance->Kernel, 1, sizeof(cl_mem), &device->Instance->TargetBuffer)
			, errorMessage
			, "Error setting target buffer to kernel"))
			return;

		if (!CL_Error::CheckError(clSetKernelArg(device->Instance->Kernel, 3, UINT32_LENGTH, &device->MaxSolutionCount)
			, errorMessage
			, "Error setting maximum solution count to kernel"))
			return;

		if (!CL_Error::CheckError(clSetKernelArg(device->Instance->Kernel, 4, sizeof(cl_mem), &device->Instance->SolutionsBuffer)
			, errorMessage
			, "Error setting solutions buffer to kernel"))
			return;

		if (!CL_Error::CheckError(clSetKernelArg(device->Instance->Kernel, 5, sizeof(cl_mem), &device->Instance->SolutionCountBuffer)
			, errorMessage
			, "Error setting solution count buffer to kernel"))
			return;
	}
}