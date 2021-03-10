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

#include <array>
#include <assert.h>

static const unsigned short UINT32_LENGTH{ 4u };
static const unsigned short UINT64_LENGTH{ 8u };
static const unsigned short MIDSTATE_LENGTH{ 25u };
static const unsigned short SPONGE_LENGTH{ 200u };
static const unsigned short ADDRESS_LENGTH{ 20u };
static const unsigned short UINT256_LENGTH{ 32u };
static const unsigned short MESSAGE_LENGTH{ UINT256_LENGTH + ADDRESS_LENGTH + UINT256_LENGTH };

typedef std::array<uint8_t, ADDRESS_LENGTH> address_t;
typedef std::array<uint8_t, UINT256_LENGTH> byte32_t;
typedef std::array<uint8_t, MESSAGE_LENGTH> message_t;
typedef std::array<uint8_t, SPONGE_LENGTH> sponge_t;

typedef struct _message_s
{
	byte32_t				challenge;
	address_t				address;
	byte32_t				solution;
} message_s;

typedef union _message_ut
{
	message_t				byteArray;
	message_s				structure;
} message_ut;

typedef union _sponge_ut
{
	sponge_t				byteArray;
	cl_ulong				uint64Array[25];
} sponge_ut;

static char constexpr ascii[][3] = {
	"00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f",
	"10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f",
	"20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f",
	"30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f",
	"40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f",
	"50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f",
	"60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f",
	"70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f",
	"80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f",
	"90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f",
	"a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af",
	"b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf",
	"c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf",
	"d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df",
	"e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef",
	"f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"
};

static uint8_t fromAscii(uint8_t const c)
{
	if (c >= '0' && c <= '9')
		return (c - '0');
	if (c >= 'a' && c <= 'f')
		return (c - 'a' + 10);
	if (c >= 'A' && c <= 'F')
		return (c - 'A' + 10);

	throw std::runtime_error("invalid character");
}

static uint8_t ascii_r(uint8_t const a, uint8_t const b)
{
	return fromAscii(a) * 16 + fromAscii(b);
}

static void HexToBytes(std::string const hex, uint8_t bytes[])
{
	for (std::string::size_type i = 0, j = 0; i < hex.length(); i += 2, ++j)
		bytes[j] = ascii_r(hex[i], hex[i + 1]);
}

template<typename T>
void hexStringToBytes(std::string const hex, T & bytes)
{
	assert(hex.length() % 2 == 0);

	if (hex.substr(0, 2) == "0x")
		HexToBytes(hex.substr(2), &bytes[0]);
	else
		HexToBytes(hex, &bytes[0]);
}

template<typename T>
const std::string bytesToHexString(T const buffer)
{
	std::string output;
	output.reserve(buffer.size() * 2 + 1);

	for (auto byte : buffer) output += ascii[byte];

	return output;
}