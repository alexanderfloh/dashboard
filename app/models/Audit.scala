package models

import scala.concurrent.Future
import play.api.Play
import util.PhabricatorFetcher
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.libs.ws.WS
import scala.concurrent.ExecutionContext.Implicits.global
import play.api.Play.current
import play.api.mvc.Results
import play.Logger

case class Audit(
    id: String,
    commit: Phabricator.PHID,
    auditor: Phabricator.UserPHID,
    reasons: List[String],
    status: String) {

}

object Audit {
  import Phabricator._
  private def config = Play.current.configuration

  def fetchOpenAudits(implicit conduit: Conduit): Future[List[Audit]] =
    fetchOpenAuditsJson.map { js =>
      (js \ "result").asOpt[List[Audit]].getOrElse(List())
    }

  def fetchCommits(commitIds: Seq[Phabricator.PHID])(implicit conduit: Conduit) = {
    val results = commitIds.distinct.grouped(100).map { commitGroup =>
      Phabricator.query("api/phid.lookup", Json.obj("names" -> commitGroup))
    }
    Future.sequence(results).map { result =>
      result.reduce { (left, right) =>
        left.asInstanceOf[JsObject].deepMerge(right.asInstanceOf[JsObject])
      }
    }
  }

  def fetchAuditsForProject(project: String)(implicit conduit: Conduit) = {
    val r = for (audits <- fetchOpenAudits) yield {
      val commitIds = audits.map(_.commit)
      val commits = fetchCommits(commitIds)
      for (commits <- commits) yield {
        audits.filter { audit =>
          (commits \ "result" \ audit.commit \ "name").as[String].startsWith(project)
        }
      }
    }
    r.flatMap(identity)
  }

  def fetchOpenAuditsJson(implicit conduit: Conduit): Future[JsValue] = {
    Phabricator.query("api/audit.query", Json.obj("status" -> "audit-status-open", "limit" -> 1000))
  }

  implicit val reads: Reads[Audit] = (
    (JsPath \ "id").read[String] and
    (JsPath \ "commitPHID").read[Phabricator.PHID] and
    (JsPath \ "auditorPHID").read[Phabricator.UserPHID] and
    (JsPath \ "reasons").read[List[String]] and
    (JsPath \ "status").read[String])(Audit.apply _)

}