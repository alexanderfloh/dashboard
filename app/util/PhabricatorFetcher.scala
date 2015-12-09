package util

import scala.concurrent.Future
import play.api.Play
import play.api.libs.ws.WS
import play.api.Play.current
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import akka.util.HashCode
import java.security.MessageDigest
import java.lang.String
import scala.concurrent.duration.Duration
import scala.concurrent.Await
import java.util.concurrent.TimeoutException
import play.Logger
import models.Audit
import models.Phabricator

object PhabricatorFetcher {

  def config = Play.current.configuration

  def conduitConnect(baseUrl: String): Future[JsObject] = {
    val phabUser = config.getString("dashboard.phabUser")
      .getOrElse(throw new RuntimeException("dashboard.phabUser not configured"))
    val phabUserCert = config.getString("dashboard.phabUserCert")
      .getOrElse(throw new RuntimeException("dashboard.phabUserCert not configured"))

    val token = System.currentTimeMillis / 1000
    val md = java.security.MessageDigest.getInstance("SHA-1")
    val signature = md.digest((token.toString() + phabUserCert).getBytes("UTF-8"))
      .map("%02x".format(_)).mkString

    val connect_params = Json.obj(
      "client" -> "Dashboard",
      "clientVersion" -> "0",
      "clientDescription" -> "Get commits where audit is needed",
      "user" -> phabUser,
      "host" -> baseUrl,
      "authToken" -> token,
      "authSignature" -> signature)

    WS.url(baseUrl + "api/conduit.connect")
      .withQueryString(
        ("params", connect_params.toString()),
        ("output", "json"),
        ("__conduit__", "True"))
      .post("")
      .map { response =>
        val json = Json.parse(response.body);
        val result = (json \ "result").asOpt[JsValue].flatMap { Option(_) }
        result.map { result =>
          Json.obj(
            "sessionKey" -> (result \\ "sessionKey").last,
            "connectionID" -> (result \\ "connectionID").last)
        }.getOrElse {
          val errorInfo = (json \ "error_info").asOpt[String].flatMap { Option(_) }
          errorInfo match {
            case Some(error) => throw new RuntimeException(error)
            case None        => throw new RuntimeException("unkown error occurred when trying to connect to phabricator")
          }
        }

      }

  }

  def baseUrl = config.getString("dashboard.urlPhabricator")
    .getOrElse(throw new RuntimeException("dashboard.urlPhabricator not configured"))

  def fetchCommits(commitIds: Seq[String]) = {
    val conduit = conduitConnect(baseUrl)
    conduit.flatMap { conduit =>
      val params = Json.obj(
        "__conduit__" -> conduit,
        "names" -> commitIds)

      WS.url(baseUrl + "api/phid.lookup")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req => Json.parse(req.body) }
    }
  }

  def fetchCommitsForAuthors(commitIds: Seq[String]) = {
    val conduit = conduitConnect(baseUrl)
    conduit.flatMap { conduit =>
      val params = Json.obj(
        "__conduit__" -> conduit,
        "phids" -> commitIds)

      WS.url(baseUrl + "api/diffusion.querycommits")
        .withQueryString(("params", params.toString()), ("output", "json"))
        .post("")
        .map { req => Json.parse(req.body) }
    }
  }

  def fetchUsersForConcerned(commitIds: Seq[String]) = {
    val commitsWithConcerns = fetchCommitsForAuthors(commitIds)
    for {
      commitsWithConcerns <- commitsWithConcerns
    } yield {
      val userIds = (commitsWithConcerns \ "result" \\ "authorPHID").map(_.as[Phabricator.PHID])
      val idsWithCounts = userIds.groupBy { _.toString() }.map { case (id, ids) => (id, ids.length) }
      idsWithCounts
    }
  }

  def fetchAuditors(auditorIds: Iterable[String]) = {
    val conduit = conduitConnect(baseUrl)
    conduit.flatMap {
      conduit =>
        val params = Json.obj(
          "__conduit__" -> conduit,
          "phids" -> auditorIds)

        WS.url(baseUrl + "api/user.query")
          .withQueryString(("params", params.toString()), ("output", "json"))
          .post("")
          .map { req =>
            val auditorsJson = Json.parse(req.body)
            val auditors = (auditorsJson \ "result").as[Seq[JsValue]]
            auditors
          }
    }
  }

  def fetchAudits = {
    val allOpenAudits = Audit.fetchOpenAudits
    allOpenAudits.flatMap { audits =>

      val commitIds = audits.map(_.commit)
      val commits = fetchCommits(commitIds)

      val result = commits.flatMap { commits =>
        val filteredAudits = audits.filter { audit =>
          (commits \ "result" \ audit.commit \ "name").as[String].startsWith("rST")
        }

        val idsWithCount = filteredAudits.groupBy(_.auditor)
          .map { case (auditorId, audits) => (auditorId, audits.length) }

        val auditorIds = idsWithCount.map { case (auditorId, _) => auditorId }.toSeq

        val concerned = filteredAudits.filter(_.status == "concerned")
        val openConcerns = fetchUsersForConcerned(concerned.map(_.commit))

        val openAudits = for {
          openConcerns <- openConcerns
        } yield {
          val allIds = idsWithCount.map(_._1) ++ openConcerns.map(_._1)
          val auditors = fetchAuditors(allIds)
          for {
            auditors <- auditors
          } yield {
            auditors.map { auditor =>
              val id = (auditor \ "phid").as[String]
              val count = idsWithCount.getOrElse(id, 0)
              val concernCount = openConcerns.getOrElse(id, 0)
              auditor.as[JsObject] + 
                ("auditCount", Json.toJson(count)) +
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
