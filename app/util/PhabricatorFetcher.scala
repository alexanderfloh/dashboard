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

//implicits:
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current

object PhabricatorFetcher {

  def projectPrefix = "rST"

  def config = Play.current.configuration

  def baseUrl = config.getString("dashboard.urlPhabricator")
    .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

  def fetchCommits(commitIds: Seq[String])(implicit conduit: Conduit) = {
    Phabricator.query("api/phid.lookup", Json.obj("names" -> commitIds))
  }

  def fetchCommitsForAuthors(commitIds: Seq[String])(implicit conduit: Conduit) = {
    Phabricator.query("api/diffusion.querycommits", Json.obj("phids" -> commitIds))
  }

  def fetchUsersForConcerned(commitIds: Seq[String])(implicit conduit: Conduit): Future[Map[Phabricator.PHID, Int]] = {
    val commitsWithConcerns = fetchCommitsForAuthors(commitIds)
    for {
      commitsWithConcerns <- commitsWithConcerns
    } yield {
      val userIds = (commitsWithConcerns \ "result" \\ "authorPHID").map(_.as[Phabricator.PHID])
      val idsWithCounts = userIds.groupBy { _.toString() }
        .map { case (id, ids) => (id, ids.length) }
      idsWithCounts
    }
  }

  def fetchAuditors(auditorIds: Iterable[Phabricator.PHID])(implicit conduit: Conduit) = {
    Phabricator.query("api/user.query", Json.obj("phids" -> auditorIds))
      .map { auditorsJson =>
        (auditorsJson \ "result").as[Seq[JsValue]]
      }
  }

  def fetchAudits = {
    val conduit = Phabricator.conduitConnect(baseUrl)
    conduit.flatMap { implicit conduit =>
      val allOpenAudits = Audit.fetchOpenAudits
      allOpenAudits.flatMap { audits =>

        val commitIds = audits.map(_.commit)
        val commits = fetchCommits(commitIds)

        val result = commits.flatMap { commits =>
          val filteredAudits = audits.filter { audit =>
            (commits \ "result" \ audit.commit \ "name").as[String].startsWith(projectPrefix)
          }

          val idsWithCount = filteredAudits.groupBy(_.auditor).map {
            case (auditorId, audits) => {
              val auditCount = audits
                .filter(_.status != "accepted")
                //.filter(_.status != "concerned")
                .length
              (auditorId, auditCount)
            }
          }

          val auditorIds = idsWithCount.map { case (auditorId, _) => auditorId }.toSeq

          val concerned = filteredAudits.filter(_.status == "concerned")
          val openConcerns = fetchUsersForConcerned(concerned.map(_.commit))

          val openAudits = for {
            openConcerns <- openConcerns
          } yield {
            val allIds = idsWithCount.map(_._1) ++ openConcerns.map(_._1)
            for {
              auditors <- fetchAuditors(allIds)
            } yield {
              auditors.map { auditor =>
                val id = (auditor \ "phid").as[Phabricator.PHID]
                val auditCount = idsWithCount.getOrElse(id, 0)
                val concernCount = openConcerns.getOrElse(id, 0)
                (auditor, auditCount, concernCount)
              }
                .filter {
                  case (auditor, auditCount, concernCount) =>
                    auditCount > 0 || concernCount > 0
                }
                .map {
                  case (auditor, auditCount, concernCount) =>
                    auditor.as[JsObject] +
                      ("auditCount", Json.toJson(auditCount)) +
                      ("concernCount", Json.toJson(concernCount))
                }
            }
          }
          openAudits.flatMap(x => x)
        }

        result.map { filteredAudits => Json.obj("audits" -> filteredAudits) }
      }
    }
  }

}
