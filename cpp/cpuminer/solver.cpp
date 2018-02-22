#include "solver.h"
#include "sha3.h"

#include <assert.h>


static const char* const ascii[] = {
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

static uint8_t fromAscii(uint8_t c)
{
  if (c >= '0' && c <= '9')
    return (c - '0');
  if (c >= 'a' && c <= 'f')
    return (c - 'a' + 10);
  if (c >= 'A' && c <= 'F')
    return (c - 'A' + 10);

#if defined(__EXCEPTIONS) || defined(DEBUG)
  throw std::runtime_error("invalid character");
#else
  return 0xff;
#endif
}

static uint8_t ascii_r(uint8_t a, uint8_t b)
{
  return fromAscii(a) * 16 + fromAscii(b);
}

static void HexToBytes(std::string const& hex, uint8_t bytes[])
{
  for (std::string::size_type i = 0, j = 0; i < hex.length(); i += 2, ++j)
  {
    bytes[j] = ascii_r(hex[i], hex[i + 1]);
  }
}


// --------------------------------------------------------------------


// static
std::atomic<uint32_t> Solver::hashes(0u); // statistics only


Solver::Solver() noexcept :
  m_address(ADDRESS_LENGTH),
  m_challenge(UINT256_LENGTH),
  m_target(UINT256_LENGTH),
  m_target_tmp(UINT256_LENGTH),
  m_buffer(ADDRESS_LENGTH + 2 * UINT256_LENGTH),
  m_buffer_tmp(ADDRESS_LENGTH + 2 * UINT256_LENGTH),
  m_buffer_ready(false),
  m_target_ready(false)
{ }

void Solver::setAddress(std::string const& addr)
{
  assert(addr.length() == (ADDRESS_LENGTH * 2 + 2));
  hexToBytes(addr, m_address);
  updateBuffer();
}

void Solver::setChallenge(std::string const& chal)
{
  assert(chal.length() == (UINT256_LENGTH * 2 + 2));
  hexToBytes(chal, m_challenge);
  updateBuffer();
}

void Solver::setTarget(std::string const& target)
{
  assert(target.length() <= (UINT256_LENGTH * 2 + 2));
  std::string const t(static_cast<std::string::size_type>(UINT256_LENGTH * 2 + 2) - target.length(), '0');

  // Double-buffer system, the trySolution() function will be blocked
  //  only when a change occurs.
  {
    std::lock_guard<std::mutex> g(m_target_mutex);
    hexToBytes("0x" + t + target.substr(2), m_target_tmp);
  }
  m_target_ready = true;
}

// Buffer order: 1-challenge 2-ethAddress 3-solution
void Solver::updateBuffer()
{
  // The idea is to have a double-buffer system in order not to try
  //  to acquire a lock on each hash() loop
  {
    std::lock_guard<std::mutex> g(m_buffer_mutex);
    std::copy(m_challenge.cbegin(), m_challenge.cend(), m_buffer_tmp.begin());
    std::copy(m_address.cbegin(), m_address.cend(), m_buffer_tmp.begin() + m_challenge.size());
  }
  m_buffer_ready = true;
}

void Solver::hash(bytes_t const& solution, bytes_t& digest)
{
  if (m_buffer_ready)
  {
    std::lock_guard<std::mutex> g(m_buffer_mutex);
    m_buffer.swap(m_buffer_tmp);
    m_buffer_ready = false;
  }

  std::copy(solution.cbegin(), solution.cend(), m_buffer.begin() + m_challenge.size() + m_address.size());
  keccak_256(&digest[0], digest.size(), &m_buffer[0], m_buffer.size());
}

bool Solver::trySolution(bytes_t const& solution)
{
  bytes_t digest(UINT256_LENGTH);
  hash(solution, digest);

  if (m_target_ready)
  {
    std::lock_guard<std::mutex> g(m_target_mutex);
    m_target.swap(m_target_tmp);
    m_target_ready = false;
  }

  ++hashes;

  return lte(digest, m_target);
}

// static
void Solver::hexToBytes(std::string const& hex, bytes_t& bytes)
{
  assert(hex.length() % 2 == 0);
  assert(bytes.size() == (hex.length() / 2 - 1));
  HexToBytes(hex.substr(2), &bytes[0]);
}

// static
std::string Solver::bytesToString(bytes_t const& buffer)
{
  std::string output;
  output.reserve(buffer.size() * 2 + 1);

  for (unsigned i = 0; i < buffer.size(); ++i)
    output += ascii[buffer[i]];

  return output;
}

// static
bool Solver::lte(bytes_t const& left, bytes_t const& right)
{
  assert(left.size() == right.size());

  for (unsigned i = 0; i < left.size(); ++i)
  {
    if (left[i] == right[i])
      continue;
    if (left[i] > right[i])
      return false;
    return true;
  }
  return true;
}
