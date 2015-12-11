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

case class Audit(
    id: String,
    commit: Phabricator.PHID,
    auditor: Phabricator.PHID,
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

  def fetchOpenAuditsJson(implicit conduit: Conduit): Future[JsValue] = {
    Phabricator.query("api/audit.query", Json.obj("status" -> "audit-status-open"))
  }

  implicit val reads: Reads[Audit] = (
    (JsPath \ "id").read[String] and
    (JsPath \ "commitPHID").read[Phabricator.PHID] and
    (JsPath \ "auditorPHID").read[Phabricator.PHID] and
    (JsPath \ "reasons").read[List[String]] and
    (JsPath \ "status").read[String])(Audit.apply _)

}