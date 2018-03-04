#include "miner.h"
#include <stdint.h>
#include <memory.h>
#include "cuda_helper.h"

#define UINT2(x,y) make_uint2(x,y)

static uint32_t *d_KNonce[MAX_GPUS];

__constant__ uint64_t pTarget[1];
__constant__ uint64_t keccak_round_constants[24] = {
	0x0000000000000001ull, 0x0000000000008082ull,
	0x800000000000808aull, 0x8000000080008000ull,
	0x000000000000808bull, 0x0000000080000001ull,
	0x8000000080008081ull, 0x8000000000008009ull,
	0x000000000000008aull, 0x0000000000000088ull,
	0x0000000080008009ull, 0x000000008000000aull,
	0x000000008000808bull, 0x800000000000008bull,
	0x8000000000008089ull, 0x8000000000008003ull,
	0x8000000000008002ull, 0x8000000000000080ull,
	0x000000000000800aull, 0x800000008000000aull,
	0x8000000080008081ull, 0x8000000000008080ull,
	0x0000000080000001ull, 0x8000000080008008ull
};

__constant__ uint2 keccak_round_constants35[24] = {
		{ 0x00000001ul, 0x00000000 }, { 0x00008082ul, 0x00000000 },
		{ 0x0000808aul, 0x80000000 }, { 0x80008000ul, 0x80000000 },
		{ 0x0000808bul, 0x00000000 }, { 0x80000001ul, 0x00000000 },
		{ 0x80008081ul, 0x80000000 }, { 0x00008009ul, 0x80000000 },
		{ 0x0000008aul, 0x00000000 }, { 0x00000088ul, 0x00000000 },
		{ 0x80008009ul, 0x00000000 }, { 0x8000000aul, 0x00000000 },
		{ 0x8000808bul, 0x00000000 }, { 0x0000008bul, 0x80000000 },
		{ 0x00008089ul, 0x80000000 }, { 0x00008003ul, 0x80000000 },
		{ 0x00008002ul, 0x80000000 }, { 0x00000080ul, 0x80000000 },
		{ 0x0000800aul, 0x00000000 }, { 0x8000000aul, 0x80000000 },
		{ 0x80008081ul, 0x80000000 }, { 0x00008080ul, 0x80000000 },
		{ 0x80000001ul, 0x00000000 }, { 0x80008008ul, 0x80000000 }
};


__constant__ uint2 c_PaddedMessage80[10]; // padded message (80 bytes + padding?)

#define bitselect(a, b, c) ((a) ^ ((c) & ((b) ^ (a))))

static void __forceinline__ __device__ keccak_block(uint2 *s)
{
	uint2 bc[5], tmpxor[5], tmp1, tmp2;

//#if __CUDA_ARCH__ > 500
//#endif
	#pragma unroll 10
	for (int i = 0; i < 24; i++)
	{
#pragma unroll
		for (uint32_t x = 0; x < 5; x++)
			tmpxor[x] = s[x] ^ s[x + 5] ^ s[x + 10] ^ s[x + 15] ^ s[x + 20];

		bc[0] = tmpxor[0] ^ ROL2(tmpxor[2], 1);
		bc[1] = tmpxor[1] ^ ROL2(tmpxor[3], 1);
		bc[2] = tmpxor[2] ^ ROL2(tmpxor[4], 1);
		bc[3] = tmpxor[3] ^ ROL2(tmpxor[0], 1);
		bc[4] = tmpxor[4] ^ ROL2(tmpxor[1], 1);

		tmp1 = s[1] ^ bc[0];

		s[0] ^= bc[4];
		s[1] = ROL2(s[6] ^ bc[0], 44);
		s[6] = ROL2(s[9] ^ bc[3], 20);
		s[9] = ROL2(s[22] ^ bc[1], 61);
		s[22] = ROL2(s[14] ^ bc[3], 39);
		s[14] = ROL2(s[20] ^ bc[4], 18);
		s[20] = ROL2(s[2] ^ bc[1], 62);
		s[2] = ROL2(s[12] ^ bc[1], 43);
		s[12] = ROL2(s[13] ^ bc[2], 25);
		s[13] = ROL8(s[19] ^ bc[3]);
		s[19] = ROR8(s[23] ^ bc[2]);
		s[23] = ROL2(s[15] ^ bc[4], 41);
		s[15] = ROL2(s[4] ^ bc[3], 27);
		s[4] = ROL2(s[24] ^ bc[3], 14);
		s[24] = ROL2(s[21] ^ bc[0], 2);
		s[21] = ROL2(s[8] ^ bc[2], 55);
		s[8] = ROL2(s[16] ^ bc[0], 45);
		s[16] = ROL2(s[5] ^ bc[4], 36);
		s[5] = ROL2(s[3] ^ bc[2], 28);
		s[3] = ROL2(s[18] ^ bc[2], 21);
		s[18] = ROL2(s[17] ^ bc[1], 15);
		s[17] = ROL2(s[11] ^ bc[0], 10);
		s[11] = ROL2(s[7] ^ bc[1], 6);
		s[7] = ROL2(s[10] ^ bc[4], 3);
		s[10] = ROL2(tmp1, 1);

		tmp1 = s[0]; tmp2 = s[1]; s[0] = bitselect(s[0] ^ s[2], s[0], s[1]); s[1] = bitselect(s[1] ^ s[3], s[1], s[2]); s[2] = bitselect(s[2] ^ s[4], s[2], s[3]); s[3] = bitselect(s[3] ^ tmp1, s[3], s[4]); s[4] = bitselect(s[4] ^ tmp2, s[4], tmp1);
		tmp1 = s[5]; tmp2 = s[6]; s[5] = bitselect(s[5] ^ s[7], s[5], s[6]); s[6] = bitselect(s[6] ^ s[8], s[6], s[7]); s[7] = bitselect(s[7] ^ s[9], s[7], s[8]); s[8] = bitselect(s[8] ^ tmp1, s[8], s[9]); s[9] = bitselect(s[9] ^ tmp2, s[9], tmp1);
		tmp1 = s[10]; tmp2 = s[11]; s[10] = bitselect(s[10] ^ s[12], s[10], s[11]); s[11] = bitselect(s[11] ^ s[13], s[11], s[12]); s[12] = bitselect(s[12] ^ s[14], s[12], s[13]); s[13] = bitselect(s[13] ^ tmp1, s[13], s[14]); s[14] = bitselect(s[14] ^ tmp2, s[14], tmp1);
		tmp1 = s[15]; tmp2 = s[16]; s[15] = bitselect(s[15] ^ s[17], s[15], s[16]); s[16] = bitselect(s[16] ^ s[18], s[16], s[17]); s[17] = bitselect(s[17] ^ s[19], s[17], s[18]); s[18] = bitselect(s[18] ^ tmp1, s[18], s[19]); s[19] = bitselect(s[19] ^ tmp2, s[19], tmp1);
		tmp1 = s[20]; tmp2 = s[21]; s[20] = bitselect(s[20] ^ s[22], s[20], s[21]); s[21] = bitselect(s[21] ^ s[23], s[21], s[22]); s[22] = bitselect(s[22] ^ s[24], s[22], s[23]); s[23] = bitselect(s[23] ^ tmp1, s[23], s[24]); s[24] = bitselect(s[24] ^ tmp2, s[24], tmp1);
		s[0] ^= keccak_round_constants35[i];
	}
}

__global__
void keccak256_gpu_hash_80(uint32_t threads, uint32_t startNounce,  uint32_t *const __restrict__ resNounce)
{
	const uint32_t thread = (blockDim.x * blockIdx.x + threadIdx.x);
	if (thread < threads)
	{
		const uint32_t nounce = startNounce + thread;
		uint2 bc[5], tmpxor[5], tmp1, tmp2;
		uint2 s[25];

		uint64_t backup = pTarget[0];

		s[9] = make_uint2(c_PaddedMessage80[9].x, cuda_swab32(nounce));
		s[10] = make_uint2(1, 0);
		s[16] = make_uint2(0, 0x80000000);

		tmpxor[0] = c_PaddedMessage80[0] ^ c_PaddedMessage80[5] ^ s[10];
		tmpxor[1] = c_PaddedMessage80[1] ^ c_PaddedMessage80[6] ^ s[16];
		tmpxor[2] = c_PaddedMessage80[2] ^ c_PaddedMessage80[7];
		tmpxor[3] = c_PaddedMessage80[3] ^ c_PaddedMessage80[8];
		tmpxor[4] = c_PaddedMessage80[4] ^ s[9];

		bc[0] = tmpxor[0] ^ ROL2(tmpxor[2], 1);
		bc[1] = tmpxor[1] ^ ROL2(tmpxor[3], 1);
		bc[2] = tmpxor[2] ^ ROL2(tmpxor[4], 1);
		bc[3] = tmpxor[3] ^ ROL2(tmpxor[0], 1);
		bc[4] = tmpxor[4] ^ ROL2(tmpxor[1], 1);

		tmp1 = c_PaddedMessage80[1] ^ bc[0];

		s[0] = c_PaddedMessage80[0] ^ bc[4];
		s[1] = ROL2(c_PaddedMessage80[6] ^ bc[0], 44);
		s[6] = ROL2(s[9] ^ bc[3], 20);
		s[9] = ROL2(bc[1], 61);
		s[22] = ROL2(bc[3], 39);
		s[14] = ROL2(bc[4], 18);
		s[20] = ROL2(c_PaddedMessage80[2] ^ bc[1], 62);
		s[2] = ROL2(bc[1], 43);
		s[12] = ROL2(bc[2], 25);
		s[13] = ROL8(bc[3]);
		s[19] = ROR8(bc[2]);
		s[23] = ROL2(bc[4], 41);
		s[15] = ROL2(c_PaddedMessage80[4] ^ bc[3], 27);
		s[4] = ROL2(bc[3], 14);
		s[24] = ROL2(bc[0], 2);
		s[21] = ROL2(c_PaddedMessage80[8] ^ bc[2], 55);
		s[8] = ROL2(s[16] ^ bc[0], 45);
		s[16] = ROL2(c_PaddedMessage80[5] ^ bc[4], 36);
		s[5] = ROL2(c_PaddedMessage80[3] ^ bc[2], 28);
		s[3] = ROL2( bc[2], 21);
		s[18] = ROL2(bc[1], 15);
		s[17] = ROL2(bc[0], 10);
		s[11] = ROL2(c_PaddedMessage80[7] ^ bc[1], 6);
		s[7] = ROL2(s[10] ^ bc[4], 3);
		s[10] = ROL2(tmp1, 1);

		tmp1 = s[0]; tmp2 = s[1]; s[0] = bitselect(s[0] ^ s[2], s[0], s[1]);
		s[0].x ^= 1;
		s[1] = bitselect(s[1] ^ s[3], s[1], s[2]); s[2] = bitselect(s[2] ^ s[4], s[2], s[3]); s[3] = bitselect(s[3] ^ tmp1, s[3], s[4]); s[4] = bitselect(s[4] ^ tmp2, s[4], tmp1);
		tmp1 = s[5]; tmp2 = s[6]; s[5] = bitselect(s[5] ^ s[7], s[5], s[6]); s[6] = bitselect(s[6] ^ s[8], s[6], s[7]);
		s[7] = bitselect(s[7] ^ s[9], s[7], s[8]); s[8] = bitselect(s[8] ^ tmp1, s[8], s[9]); s[9] = bitselect(s[9] ^ tmp2, s[9], tmp1);
		tmp1 = s[10]; tmp2 = s[11]; s[10] = bitselect(s[10] ^ s[12], s[10], s[11]); s[11] = bitselect(s[11] ^ s[13], s[11], s[12]); s[12] = bitselect(s[12] ^ s[14], s[12], s[13]); s[13] = bitselect(s[13] ^ tmp1, s[13], s[14]); s[14] = bitselect(s[14] ^ tmp2, s[14], tmp1);
		tmp1 = s[15]; tmp2 = s[16]; s[15] = bitselect(s[15] ^ s[17], s[15], s[16]); s[16] = bitselect(s[16] ^ s[18], s[16], s[17]); s[17] = bitselect(s[17] ^ s[19], s[17], s[18]); s[18] = bitselect(s[18] ^ tmp1, s[18], s[19]); s[19] = bitselect(s[19] ^ tmp2, s[19], tmp1);
		tmp1 = s[20]; tmp2 = s[21]; s[20] = bitselect(s[20] ^ s[22], s[20], s[21]); s[21] = bitselect(s[21] ^ s[23], s[21], s[22]); s[22] = bitselect(s[22] ^ s[24], s[22], s[23]); s[23] = bitselect(s[23] ^ tmp1, s[23], s[24]); s[24] = bitselect(s[24] ^ tmp2, s[24], tmp1);

		#if __CUDA_ARCH__ > 500
		#pragma unroll 10
		#else
		#pragma unroll 2
		#endif
		for (int i = 1; i < 23; i++)
		{

#pragma unroll
			for (uint32_t x = 0; x < 5; x++)
				tmpxor[x] = s[x] ^ s[x + 5] ^ s[x + 10] ^ s[x + 15] ^ s[x + 20];

			bc[0] = tmpxor[0] ^ ROL2(tmpxor[2], 1);
			bc[1] = tmpxor[1] ^ ROL2(tmpxor[3], 1);
			bc[2] = tmpxor[2] ^ ROL2(tmpxor[4], 1);
			bc[3] = tmpxor[3] ^ ROL2(tmpxor[0], 1);
			bc[4] = tmpxor[4] ^ ROL2(tmpxor[1], 1);

			tmp1 = s[1] ^ bc[0];

			s[0] ^= bc[4];
			s[1] = ROL2(s[6] ^ bc[0], 44);
			s[6] = ROL2(s[9] ^ bc[3], 20);
			s[9] = ROL2(s[22] ^ bc[1], 61);
			s[22] = ROL2(s[14] ^ bc[3], 39);
			s[14] = ROL2(s[20] ^ bc[4], 18);
			s[20] = ROL2(s[2] ^ bc[1], 62);
			s[2] = ROL2(s[12] ^ bc[1], 43);
			s[12] = ROL2(s[13] ^ bc[2], 25);
			s[13] = ROL8(s[19] ^ bc[3]);
			s[19] = ROR8(s[23] ^ bc[2]);
			s[23] = ROL2(s[15] ^ bc[4], 41);
			s[15] = ROL2(s[4] ^ bc[3], 27);
			s[4] = ROL2(s[24] ^ bc[3], 14);
			s[24] = ROL2(s[21] ^ bc[0], 2);
			s[21] = ROL2(s[8] ^ bc[2], 55);
			s[8] = ROL2(s[16] ^ bc[0], 45);
			s[16] = ROL2(s[5] ^ bc[4], 36);
			s[5] = ROL2(s[3] ^ bc[2], 28);
			s[3] = ROL2(s[18] ^ bc[2], 21);
			s[18] = ROL2(s[17] ^ bc[1], 15);
			s[17] = ROL2(s[11] ^ bc[0], 10);
			s[11] = ROL2(s[7] ^ bc[1], 6);
			s[7] = ROL2(s[10] ^ bc[4], 3);
			s[10] = ROL2(tmp1, 1);

			tmp1 = s[0]; tmp2 = s[1]; s[0] = bitselect(s[0] ^ s[2], s[0], s[1]);
			s[1] = bitselect(s[1] ^ s[3], s[1], s[2]); s[2] = bitselect(s[2] ^ s[4], s[2], s[3]); s[3] = bitselect(s[3] ^ tmp1, s[3], s[4]); s[4] = bitselect(s[4] ^ tmp2, s[4], tmp1);
			tmp1 = s[5]; tmp2 = s[6]; s[5] = bitselect(s[5] ^ s[7], s[5], s[6]); s[6] = bitselect(s[6] ^ s[8], s[6], s[7]); s[7] = bitselect(s[7] ^ s[9], s[7], s[8]); s[8] = bitselect(s[8] ^ tmp1, s[8], s[9]); s[9] = bitselect(s[9] ^ tmp2, s[9], tmp1);
			tmp1 = s[10]; tmp2 = s[11]; s[10] = bitselect(s[10] ^ s[12], s[10], s[11]); s[11] = bitselect(s[11] ^ s[13], s[11], s[12]); s[12] = bitselect(s[12] ^ s[14], s[12], s[13]); s[13] = bitselect(s[13] ^ tmp1, s[13], s[14]); s[14] = bitselect(s[14] ^ tmp2, s[14], tmp1);
			s[0] ^= keccak_round_constants35[i];
			tmp1 = s[15]; tmp2 = s[16]; s[15] = bitselect(s[15] ^ s[17], s[15], s[16]); s[16] = bitselect(s[16] ^ s[18], s[16], s[17]); s[17] = bitselect(s[17] ^ s[19], s[17], s[18]); s[18] = bitselect(s[18] ^ tmp1, s[18], s[19]); s[19] = bitselect(s[19] ^ tmp2, s[19], tmp1);
			tmp1 = s[20]; tmp2 = s[21]; s[20] = bitselect(s[20] ^ s[22], s[20], s[21]); s[21] = bitselect(s[21] ^ s[23], s[21], s[22]); s[22] = bitselect(s[22] ^ s[24], s[22], s[23]); s[23] = bitselect(s[23] ^ tmp1, s[23], s[24]); s[24] = bitselect(s[24] ^ tmp2, s[24], tmp1);
		}
		uint2 t[5];
		t[0] = s[0] ^ s[5] ^ s[10] ^ s[15] ^ s[20];
		t[1] = s[1] ^ s[6] ^ s[11] ^ s[16] ^ s[21];
		t[2] = s[2] ^ s[7] ^ s[12] ^ s[17] ^ s[22];
		t[3] = s[3] ^ s[8] ^ s[13] ^ s[18] ^ s[23];
		t[4] = s[4] ^ s[9] ^ s[14] ^ s[19] ^ s[24];

		s[0] ^= t[4] ^ ROL2(t[1], 1);
		s[18] ^= t[2] ^ ROL2(t[4], 1);
		s[24] ^= t[3] ^ ROL2(t[0], 1);

		s[3] = ROL2(s[18], 21) ^ ((~ROL2(s[24], 14)) & s[0]);


		if (devectorize(s[3]) <= backup)
		{
			uint32_t tmp = atomicCAS(resNounce, 0xffffffff, nounce);
			if (tmp != 0xffffffff)
				resNounce[1] = nounce;
		}
	}
}

__host__
void keccak256_cpu_hash_80(int thr_id, uint32_t threads, uint32_t startNounce, uint32_t *h_nounce)
{
	cudaMemset(d_KNonce[thr_id], 0xffffffff, 2*sizeof(uint32_t));
	const uint32_t threadsperblock = 512;

	dim3 grid((threads + threadsperblock-1)/threadsperblock);
	dim3 block(threadsperblock);
	keccak256_gpu_hash_80<<<grid, block>>>(threads, startNounce, d_KNonce[thr_id]);
	CUDA_SAFE_CALL(cudaMemcpy(h_nounce, d_KNonce[thr_id], 2 * sizeof(uint32_t), cudaMemcpyDeviceToHost));
}

__global__ __launch_bounds__(256,3)
void keccak256_gpu_hash_32(uint32_t threads, uint32_t startNounce, uint64_t *outputHash)
{
	const uint32_t thread = (blockDim.x * blockIdx.x + threadIdx.x);
	if (thread < threads)
	{
		uint2 keccak_gpu_state[25];
		#pragma unroll 25
		for (int i = 0; i<25; i++) {
			if (i<4) keccak_gpu_state[i] = vectorize(outputHash[i*threads+thread]);
			else     keccak_gpu_state[i] = UINT2(0, 0);
		}
		keccak_gpu_state[4]  = UINT2(1, 0);
		keccak_gpu_state[16] = UINT2(0, 0x80000000);
		keccak_block(keccak_gpu_state);

		#pragma unroll 4
		for (int i=0; i<4; i++)
			outputHash[i*threads+thread] = devectorize(keccak_gpu_state[i]);
	}
}

__host__
void keccak256_cpu_hash_32(int thr_id, uint32_t threads, uint32_t startNounce, uint64_t *d_outputHash)
{
	const uint32_t threadsperblock = 64;

	dim3 grid((threads + threadsperblock - 1) / threadsperblock);
	dim3 block(threadsperblock);

	keccak256_gpu_hash_32 <<<grid, block>>> (threads, startNounce, d_outputHash);
}

__host__
void keccak256_setBlock_80(void *pdata,const uint64_t *pTargetIn)
{
	unsigned char PaddedMessage[80];
	memcpy(PaddedMessage, pdata, 80);
	CUDA_SAFE_CALL(cudaMemcpyToSymbol(pTarget, &pTargetIn[3], 2*sizeof(uint32_t), 0, cudaMemcpyHostToDevice));
	CUDA_SAFE_CALL(cudaMemcpyToSymbol(c_PaddedMessage80, PaddedMessage, 10*sizeof(uint64_t), 0, cudaMemcpyHostToDevice));
}

__host__
void keccak256_cpu_init(int thr_id, uint32_t threads)
{
	CUDA_SAFE_CALL(cudaMalloc(&d_KNonce[thr_id], 2*sizeof(uint32_t)));
}
