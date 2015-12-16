package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.libs.json._
import akka.util.HashCode
import java.security.MessageDigest
import java.lang.String
import scala.concurrent.duration.Duration
import scala.concurrent.Await
import java.util.concurrent.TimeoutException
import play.Logger
import models.Audit
import models.Phabricator
import models.Phabricator._
import play.api.mvc.Results._
import play.api.mvc.Results
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current
import models.Auditor

object PhabricatorFetcher {

  private def config = Play.current.configuration
  private def projectPrefix = "rST"

  private def baseUrl = config.getString("dashboard.urlPhabricator")
    .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

  private def fetchCommitsForAuthors(commitIds: Seq[Phabricator.PHID])(implicit conduit: Conduit) = {
    Phabricator.query("api/diffusion.querycommits", Json.obj("phids" -> commitIds))
  }

  private def fetchUsersForConcerned(audits: Seq[Audit])(implicit conduit: Conduit) = {
    val commitIdsWithConcerns = audits.filter(_.status == "concerned").map(_.commit)

    for {
      commitsWithConcerns <- fetchCommitsForAuthors(commitIdsWithConcerns)
    } yield {
      val userIds = (commitsWithConcerns \ "result" \\ "authorPHID").map(_.as[Phabricator.UserPHID])
      val idsWithCounts = userIds
        .groupBy { identity }
        .map { case (id, ids) => (id, ids.length) }
      idsWithCounts
    }
  }

  private def getUsersForAudits(filteredAudits: List[Audit]) = {
    filteredAudits.groupBy(_.auditor).map {
      case (auditorId, audits) => {
        val auditCount = audits
          .filter(_.status != "accepted")
          .length
        (auditorId, auditCount)
      }
    }
  }

  private def fetchAuditors(auditorIds: Iterable[Phabricator.UserPHID])(implicit conduit: Conduit) = {
    Phabricator.query("api/user.query", Json.obj("phids" -> auditorIds))
      .map { auditorsJson =>
        (auditorsJson \ "result").as[Seq[JsValue]]
      }
  }

  def fetchAudits: Future[JsObject] = {
    val r = for {
      c <- Phabricator.conduitConnect(baseUrl)
    } yield {
      implicit val conduit = c
      val result = for {
        projectAudits <- Audit.fetchAuditsForProject(projectPrefix)
        usersWithProblematicCommits <- fetchUsersForConcerned(projectAudits)
        auditors <- fetchAuditors(getUsersForAudits(projectAudits).keySet ++ usersWithProblematicCommits.keySet)
      } yield {
        val openAudits = auditors.map { auditorJson =>
          implicit val reads = Auditor.reads
          implicit val writes = Auditor.writes
          
          auditorJson.asOpt[Auditor].map { auditor =>
            val auditCount = getUsersForAudits(projectAudits).getOrElse(auditor.id, 0)
            val concernCount = usersWithProblematicCommits.getOrElse(auditor.id, 0)
            auditor.copy(auditCount = auditCount, concernCount = concernCount)
          }
        }
          .flatten
          .filter(_.hasAuditsOrConcerns)
          .map(Json.toJson(_))
        Json.obj("audits" -> openAudits)
      }

      result
    }
    r.flatMap(identity)
  }

}
