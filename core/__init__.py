# core/__init__.py
from .Snapshot import ElementSnapshot, SnapshotStore, capture_snapshot
from .Exception_interceptor import ExceptionInterceptor, RecoveryActions, ExceptionType, HealingStrategy
from .Similarity_engine_v2 import SimilarityEngineV2, find_candidates_v2, Candidate, SimilarityDetail
from .Healing_driver_v2 import SelfHealingDriverV2, CandidateRanker, _SimpleKnowledgeBase