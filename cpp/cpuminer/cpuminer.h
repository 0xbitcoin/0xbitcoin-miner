#ifndef  _CPUMINER_H_
#define  _CPUMINER_H_

#include "solver.h"

#include <thread>


class CpuMiner
{
public:
  CpuMiner() noexcept;
  ~CpuMiner();

public:
  void setChallengeNumber(std::string const& challengeNumber);
  void setDifficultyTarget(std::string const& difficultyTarget);
  void setMinerAddress(std::string const& minerAddress);

public:
  void run();
  void stop();

  std::string solution() const;

private:
  void thr_func(Solver& solver);

  void solutionFound(Solver::bytes_t const& solution);

private:
  void set(void (Solver::*fn)(std::string const&), std::string const& p);

private:
  std::vector<Solver> m_solvers;
  std::vector<std::thread> m_threads;

  std::mutex m_solution_mutex;
  Solver::bytes_t m_solution;
  bool m_bSolutionFound;

  volatile bool m_bExit;
};

#endif // ! _CPUMINER_H_
