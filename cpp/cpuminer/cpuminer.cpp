#include "cpuminer.h"

#include <chrono>
#include <random>
#include <thread>


CpuMiner::CpuMiner() noexcept :
  m_solvers(std::thread::hardware_concurrency()),
  m_threads(std::thread::hardware_concurrency()),
  m_solution(Solver::UINT256_LENGTH),
  m_bSolutionFound(false),
  m_bExit(false)
{
}

CpuMiner::~CpuMiner()
{
  stop();

  // Wait for run() to terminate
  //  This is not very clean but it's the easiest portable way to
  //  exit gracefully if stop() has not been called before the destructor.
  std::this_thread::yield();
  for (auto&& thr : m_threads)
  {
    if (!thr.joinable())
      std::this_thread::sleep_for(std::chrono::milliseconds(50u));
  }
}

void CpuMiner::setChallengeNumber(std::string const& challengeNumber)
{
  set(&Solver::setChallenge, challengeNumber);
}

void CpuMiner::setDifficultyTarget(std::string const& difficultyTarget)
{
  set(&Solver::setTarget, difficultyTarget);
}

void CpuMiner::setMinerAddress(std::string const& minerAddress)
{
  set(&Solver::setAddress, minerAddress);
}

// This is a the "main" thread of execution
void CpuMiner::run()
{
  m_bExit = m_bSolutionFound = false;

  // These are the Solver threads
  for (size_t x = 0; x < m_threads.size(); ++x)
    m_threads[x] = std::thread([&, x] { this->thr_func(this->m_solvers[x]); });

  for (auto&& thr: m_threads)
    thr.join();
}

void CpuMiner::stop()
{
  m_bExit = true;
}

void CpuMiner::thr_func(Solver& solver)
{
  std::random_device r;
  std::mt19937_64 gen(r());
  std::uniform_int_distribution<> dist(0, 0xffffffff);

  Solver::bytes_t solution(Solver::UINT256_LENGTH);

  while (!m_bExit)
  {
    for (size_t i = 0; i < solution.size(); i += 4)
    {
      uint32_t const tmp = dist(gen);
      solution[i]     = static_cast<uint8_t> (tmp & 0x000000ff);
      solution[i + 1] = static_cast<uint8_t>((tmp & 0x0000ff00) >> 8);
      solution[i + 2] = static_cast<uint8_t>((tmp & 0x00ff0000) >> 16);
      solution[i + 3] = static_cast<uint8_t>((tmp & 0xff000000) >> 24);
    }

    if (solver.trySolution(solution))
    {
      solutionFound(solution);
      break;
    }
  }
}

// When this function terminates, the "main" thread run() should end
//  and the caller can check the solution()
void CpuMiner::solutionFound(Solver::bytes_t const& solution)
{
  {
    std::lock_guard<std::mutex> g(m_solution_mutex);
    m_solution = solution;
    m_bSolutionFound = true;
  }

  stop();  //keep going 
}

void CpuMiner::set(void (Solver::*fn)(std::string const&), std::string const& p)
{
  for (auto&& i : m_solvers)
    (i.*fn)(p);
}

std::string CpuMiner::solution() const
{
  return m_bSolutionFound ? ("0x" + Solver::bytesToString(m_solution)) : std::string();
}
