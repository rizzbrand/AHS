"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardCheck,
  Clock,
  Lock,
  MapPin,
  MessageSquare,
  Phone,
  ShieldAlert,
  UserPlus,
} from "lucide-react";
import { AssigneeCell, Avatar, PillSelect } from "../ui/DataTable";
import { PriorityMark, StatusBadge } from "../ui/StatusBadge";
import { useDemo } from "../../lib/demo-store";
import { longDate, money, shortDate, timeLabel } from "../../lib/format";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  SERVICE_LABEL,
  SOURCE_LABEL,
} from "../../lib/labels";
import { can } from "../../lib/permissions";
import {
  assigneeLabel,
  customerName,
  isOpen,
  propertyById,
} from "../../lib/records";
import { auditEvents, customers, employees } from "../../lib/seed";
import { useSession } from "../../lib/session";
import { dueInfo, stageOf, STAGES } from "../../lib/stages";
import { JobStatus, WorkOrder } from "../../lib/types";
import {
  canAssign,
  checklistFor,
  documentationGaps,
  documentationReady,
  photoProgress,
  transitionsFor,
} from "../../lib/workflow";

const TABS = [
  "Overview",
  "Scope",
  "Inspection",
  "Assignment",
  "Documentation",
  "Financial",
  "Notes",
  "Activity",
] as const;
type Tab = (typeof TABS)[number];

const card = "rounded-2xl border border-[#ece6dc] bg-white";
const primaryButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#cfc9c0]";
const quietButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#e6dfd4] bg-white px-4 text-sm font-medium text-ink transition hover:border-[#cfc6b8]";
const fieldInput =
  "w-full rounded-xl bg-[#f6f3ee] px-3.5 py-2.5 text-sm text-ink outline-none ring-copper/30 placeholder:text-[#a59d92] focus:ring-2";

export function JobWorkspace({ order }: { order: WorkOrder }) {
  const { user } = useSession();
  const {
    orders,
    advance,
    schedule,
    checkIn,
    checkOut,
    assignEmployee,
    assignContractor,
    toggleCheck,
    addPhoto,
    addNote,
    saveScope,
    eligibleContractors: activeCrew,
  } = useDemo();
  const [tab, setTab] = useState<Tab>("Overview");
  const [when, setWhen] = useState("2026-10-03T09:00");
  const [person, setPerson] = useState("");
  const [note, setNote] = useState("");
  const [scope, setScope] = useState(order.verifiedScope ?? order.scope);
  const [scopeSaved, setScopeSaved] = useState(false);
  const property = propertyById(order.propertyId);
  const customer = customers.find((item) => item.id === order.customerId);
  if (!user || !property) return null;

  const showMoney = can(user.role, "jobs.financial");
  const showContact = can(user.role, "customers.contact");
  const showInternal =
    user.role === "owner" ||
    user.role === "operations" ||
    user.role === "estimator";
  const canDispatch = can(user.role, "dispatch.read");
  const photos = photoProgress(order);
  const checklist = checklistFor(order);
  const checksDone = checklist.filter((item) => item.done).length;
  const gaps = documentationGaps(order);
  const history = timeline(order);
  const awaitingAcceptance = Boolean(order.contractorId && !order.acceptedAt);
  const steps = transitionsFor(order, user.role).filter(
    (step) => !(awaitingAcceptance && step.to === "IN_PROGRESS"),
  );
  const tabs = TABS.filter((item) => item !== "Financial" || showMoney);
  const fieldCrew = employees.filter((employee) => employee.role === "field");
  const open = isOpen(order);
  const due = dueInfo(order.dueAt);
  const assigned = Boolean(order.assigneeId || order.contractorId);
  const needsPerson = canDispatch && canAssign(order.status) && !assigned;

  const ordered = [...orders].sort((a, b) => a.number.localeCompare(b.number));
  const position = ordered.findIndex((item) => item.id === order.id);
  const previous = position > 0 ? ordered[position - 1] : undefined;
  const next =
    position < ordered.length - 1 ? ordered[position + 1] : undefined;

  const badges: Partial<Record<Tab, string>> = {
    Inspection: `${checksDone}/${checklist.length}`,
    Documentation: `${photos.done}/${photos.total}`,
    Notes: String((order.notes ?? []).length),
    Activity: String(history.length),
  };

  function run(to: JobStatus) {
    if (to === "IN_PROGRESS") checkIn(order.id, user!.name);
    else if (to === "AWAITING_DOCUMENTATION") checkOut(order.id, user!.name);
    else advance(order.id, to, user!.role, user!.name);
  }

  return (
    <div className="mx-auto max-w-[1240px] pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/work-orders"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-ink"
        >
          <ArrowLeft size={15} />
          Work orders
        </Link>
        <div className="flex items-center gap-1.5 text-sm text-muted">
          <span className="tabular">
            {position + 1} of {ordered.length}
          </span>
          <NavArrow
            href={previous ? `/work-orders/${previous.id}` : undefined}
            label={
              previous ? `Previous: ${previous.number}` : "No previous job"
            }
          >
            <ChevronLeft size={16} />
          </NavArrow>
          <NavArrow
            href={next ? `/work-orders/${next.id}` : undefined}
            label={next ? `Next: ${next.number}` : "No next job"}
          >
            <ChevronRight size={16} />
          </NavArrow>
        </div>
      </div>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9a9187]">
            <span>{SOURCE_LABEL[order.source]}</span>
            <span className="text-[#d6cec2]">·</span>
            <span className="tabular">{order.externalId}</span>
            <span className="text-[#d6cec2]">·</span>
            <span>Created {shortDate(order.createdAt)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-[2.4rem] leading-none tracking-tight text-ink">
              {order.number}
            </h1>
            <StatusBadge status={order.status} />
            <span className="rounded-full border border-[#ece6dc] px-2.5 py-1 leading-none">
              <PriorityMark priority={order.priority} />
            </span>
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="font-medium text-ink">
              {SERVICE_LABEL[order.service]}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} />
              {property.name}, {property.city}, {property.state}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 ${open ? due.tone : ""}`}
            >
              <Clock size={14} />
              Due {shortDate(order.dueAt)}
              {open ? ` · ${due.text}` : ""}
            </span>
          </p>
        </div>
      </header>

      <StageStepper status={order.status} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <nav
            aria-label="Work order sections"
            className="flex gap-1 overflow-x-auto border-b border-[#ece6dc]"
          >
            {tabs.map((item) => {
              const active = tab === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setTab(item)}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 pb-3 pt-1 text-sm transition ${
                    active
                      ? "border-ink font-semibold text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {item}
                  {badges[item] && badges[item] !== '0' ? (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular leading-none ${active ? "bg-ink text-white" : "bg-[#f3efe6] text-muted"}`}
                    >
                      {badges[item]}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 space-y-5">
            {tab === "Overview" ? (
              <>
                <section className={`${card} p-5`}>
                  <SectionTitle
                    title="Verified scope"
                    action={
                      <TextButton onClick={() => setTab("Scope")}>
                        Open scope
                      </TextButton>
                    }
                  />
                  <p className="mt-3 text-[15px] leading-7 text-ink">
                    {order.verifiedScope ?? order.scope}
                  </p>
                  {order.verifiedScope &&
                  order.verifiedScope !== order.scope ? (
                    <p className="mt-3 rounded-xl bg-[#faf8f4] px-3.5 py-2.5 text-xs leading-5 text-muted">
                      <span className="font-semibold text-[#6d655c]">
                        Original request:{" "}
                      </span>
                      {order.scope}
                    </p>
                  ) : null}
                </section>

                <section className={`${card} p-5`}>
                  <SectionTitle
                    title="Closeout readiness"
                    lede="What the service rule needs before completion can be submitted."
                  />
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Meter
                      icon={Camera}
                      label="Required photos"
                      done={photos.done}
                      total={photos.total}
                      onOpen={() => setTab("Documentation")}
                    />
                    <Meter
                      icon={ClipboardCheck}
                      label="Checklist"
                      done={checksDone}
                      total={checklist.length}
                      onOpen={() => setTab("Inspection")}
                    />
                  </div>
                  {gaps.length ? (
                    <ul className="mt-4 space-y-2">
                      {gaps.map((gap) => (
                        <li
                          key={gap}
                          className="flex items-center gap-2.5 rounded-xl bg-[#fbf3e4] px-3.5 py-2.5 text-sm text-[#7a4e08]"
                        >
                          <ShieldAlert size={15} className="shrink-0" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 flex items-center gap-2.5 rounded-xl bg-[#eaf4ea] px-3.5 py-2.5 text-sm text-[#1d5a32]">
                      <CheckCircle2 size={15} />
                      Documentation satisfies the service rule.
                    </p>
                  )}
                </section>

                <section className={`${card} p-5`}>
                  <SectionTitle
                    title="Recent activity"
                    action={
                      history.length > 4 ? (
                        <TextButton onClick={() => setTab("Activity")}>
                          All activity
                        </TextButton>
                      ) : null
                    }
                  />
                  {history.length ? (
                    <Timeline events={[...history].reverse().slice(0, 4)} />
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      No moves recorded on this job yet. Status changes, photos,
                      and notes will show here.
                    </p>
                  )}
                </section>
              </>
            ) : null}

            {tab === "Scope" ? (
              <section className={`${card} p-5`}>
                <SectionTitle
                  title="Original request"
                  lede={`As received from ${SOURCE_LABEL[order.source]}.`}
                />
                <p className="mt-3 rounded-xl bg-[#faf8f4] px-4 py-3 text-sm leading-6 text-[#4a443d]">
                  {order.scope}
                </p>
                <div className="mt-6">
                  <SectionTitle
                    title="Verified scope"
                    lede="What we will actually do on site. Field crews work from this."
                  />
                </div>
                {showInternal ? (
                  <form
                    className="mt-3 space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveScope(order.id, scope, user.name);
                      setScopeSaved(true);
                    }}
                  >
                    <textarea
                      value={scope}
                      onChange={(event) => {
                        setScope(event.target.value);
                        setScopeSaved(false);
                      }}
                      rows={5}
                      className={`${fieldInput} leading-6`}
                    />
                    <div className="flex items-center gap-3">
                      <button type="submit" className={primaryButton}>
                        Save verified scope
                      </button>
                      {scopeSaved ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#1d5a32]">
                          <Check size={14} /> Saved
                        </span>
                      ) : null}
                    </div>
                  </form>
                ) : (
                  <p className="mt-3 text-sm leading-6">
                    {order.verifiedScope}
                  </p>
                )}
                <div className="mt-6 border-t border-[#f0ebe3] pt-5">
                  <SectionTitle title="Internal notes" />
                  {showInternal ? (
                    <p className="mt-2 text-sm leading-6 text-muted">
                      {order.internalNotes}
                    </p>
                  ) : (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                      <Lock size={14} /> Internal notes are held by operations
                      and estimating.
                    </p>
                  )}
                </div>
              </section>
            ) : null}

            {tab === "Inspection" ? (
              <section className={`${card} p-5`}>
                <SectionTitle
                  title={
                    order.inspectionRequired
                      ? "Inspection and completion checklist"
                      : "Completion checklist"
                  }
                  lede={`${checksDone} of ${checklist.length} done. Tap an item to mark it.`}
                />
                <ProgressBar done={checksDone} total={checklist.length} />
                <ul className="mt-4 space-y-2">
                  {checklist.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggleCheck(order.id, item.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                          item.done
                            ? "border-[#d6e8d6] bg-[#f3f9f2] text-[#1d5a32]"
                            : "border-[#ece6dc] bg-white text-ink hover:border-[#cfc6b8]"
                        }`}
                      >
                        {item.done ? (
                          <CheckCircle2 size={18} className="shrink-0" />
                        ) : (
                          <Circle
                            size={18}
                            className="shrink-0 text-[#cfc6b8]"
                          />
                        )}
                        <span
                          className={`flex-1 ${item.done ? "line-through decoration-[#9cc39c]" : ""}`}
                        >
                          {item.label}
                        </span>
                        <span className="text-xs font-medium">
                          {item.done ? "Done" : "Mark done"}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {tab === "Assignment" ? (
              <>
                <section className={`${card} p-5`}>
                  <SectionTitle title="Current assignment" />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <AssigneeCell order={order} />
                    <div className="flex flex-wrap gap-2">
                      {order.contractorId ? (
                        order.acceptedAt ? (
                          <Chip tone="good">
                            Accepted {timeLabel(order.acceptedAt)}
                          </Chip>
                        ) : (
                          <Chip tone="warn">
                            Waiting on contractor to accept
                          </Chip>
                        )
                      ) : null}
                      <Chip tone={order.scheduledStart ? "info" : "muted"}>
                        {order.scheduledStart
                          ? `On site ${timeLabel(order.scheduledStart)}`
                          : "Not scheduled"}
                      </Chip>
                      {order.checkedInAt ? (
                        <Chip tone="good">
                          Checked in {timeLabel(order.checkedInAt)}
                        </Chip>
                      ) : null}
                      {order.checkedOutAt ? (
                        <Chip tone="good">
                          Checked out {timeLabel(order.checkedOutAt)}
                        </Chip>
                      ) : null}
                    </div>
                  </div>
                </section>
                {canDispatch && canAssign(order.status) ? (
                  <section className={`${card} p-5`}>
                    <SectionTitle
                      title={assigned ? "Reassign" : "Assign someone"}
                      lede="Only active contractors with current paperwork are listed."
                    />
                    <form
                      className="mt-4 flex flex-wrap items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!person) return;
                        if (person.startsWith("c-"))
                          assignContractor(order.id, person, user.name);
                        else assignEmployee(order.id, person, user.name);
                        setPerson("");
                      }}
                    >
                      <PillSelect
                        value={person}
                        onChange={setPerson}
                        width="w-72"
                      >
                        <option value="">Choose a person</option>
                        <optgroup label="Field team">
                          {fieldCrew.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Contractors">
                          {activeCrew.map((contractor) => (
                            <option key={contractor.id} value={contractor.id}>
                              {contractor.company}
                            </option>
                          ))}
                        </optgroup>
                      </PillSelect>
                      <button
                        type="submit"
                        disabled={!person}
                        className={primaryButton}
                      >
                        <UserPlus size={15} />
                        Assign
                      </button>
                      <Link
                        href="/dispatch"
                        className="ml-1 text-sm font-medium text-copper hover:underline"
                      >
                        Or use the dispatch board
                      </Link>
                    </form>
                  </section>
                ) : (
                  <p
                    className={`${card} flex items-center gap-2.5 px-5 py-4 text-sm text-muted`}
                  >
                    <Lock size={14} />
                    Assignment opens once the job is approved. Earlier statuses
                    stay with review and estimating.
                  </p>
                )}
                <section className={`${card} p-5`}>
                  <SectionTitle title="Assignment history" />
                  {(order.assignments ?? []).length ? (
                    <Timeline
                      events={(order.assignments ?? []).map((entry) => ({
                        id: entry.id,
                        at: entry.at,
                        actor: entry.actor,
                        action: "Assigned",
                        detail: entry.who,
                      }))}
                    />
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      No one has been assigned.
                    </p>
                  )}
                </section>
              </>
            ) : null}

            {tab === "Documentation" ? (
              <section className={`${card} p-5`}>
                <SectionTitle
                  title="Required photos"
                  lede={`${photos.done} of ${photos.total} in file. The service rule decides which shots are required.`}
                />
                <ProgressBar done={photos.done} total={photos.total} />
                <ul className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {order.photos.map((photo) => (
                    <li
                      key={photo.category}
                      className={`flex flex-col overflow-hidden rounded-xl border ${photo.done ? "border-[#d6e8d6]" : "border-dashed border-[#d9cfc0]"}`}
                    >
                      <div
                        className={`grid aspect-[4/3] place-items-center ${photo.done ? "bg-[#eef5ec] text-[#2f7a4a]" : "bg-[#faf8f4] text-[#b9b0a3]"}`}
                      >
                        {photo.done ? (
                          <CheckCircle2 size={26} />
                        ) : (
                          <Camera size={26} />
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                        <span className="text-sm font-medium text-ink">
                          {photo.category}
                        </span>
                        {photo.done ? (
                          <span className="text-xs font-semibold text-[#2f7a4a]">
                            In file
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              addPhoto(order.id, photo.category, user.name)
                            }
                            className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Add photo
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <p
                  className={`mt-5 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm ${
                    documentationReady(order)
                      ? "bg-[#eaf4ea] text-[#1d5a32]"
                      : "bg-[#faf8f4] text-muted"
                  }`}
                >
                  {documentationReady(order) ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Lock size={15} />
                  )}
                  {documentationReady(order)
                    ? "The service rule is satisfied. Completion can be submitted."
                    : `Submission stays locked. ${gaps.join(". ")}.`}
                </p>
              </section>
            ) : null}

            {tab === "Financial" && showMoney ? (
              <section className={`${card} p-5`}>
                <SectionTitle
                  title="Pricing"
                  lede="Invoice documents are handed to JobTread. This panel is not a live billing connection."
                />
                <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MoneyTile
                    label="Estimate"
                    value={
                      order.estimate != null
                        ? money(order.estimate)
                        : "Not priced"
                    }
                  />
                  <MoneyTile
                    label="Approved"
                    value={
                      order.approvedAmount != null
                        ? money(order.approvedAmount)
                        : "Pending"
                    }
                  />
                  <MoneyTile
                    label="Contractor cost"
                    value={
                      order.contractorCost != null
                        ? money(order.contractorCost)
                        : "—"
                    }
                  />
                  <MoneyTile
                    label="Margin"
                    value={
                      order.approvedAmount != null &&
                      order.contractorCost != null
                        ? money(order.approvedAmount - order.contractorCost)
                        : "—"
                    }
                    note={
                      order.approvedAmount && order.contractorCost != null
                        ? `${Math.round(((order.approvedAmount - order.contractorCost) / order.approvedAmount) * 100)}% of approved`
                        : undefined
                    }
                  />
                </dl>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#faf8f4] px-4 py-3 text-sm">
                  <span className="text-muted">Payment</span>
                  <Chip
                    tone={
                      order.paymentStatus === "overdue"
                        ? "risk"
                        : order.paymentStatus === "paid"
                          ? "good"
                          : "muted"
                    }
                  >
                    <span className="capitalize">
                      {order.paymentStatus ?? "Unbilled"}
                    </span>
                  </Chip>
                </div>
              </section>
            ) : null}

            {tab === "Notes" ? (
              <>
                <form
                  className={`${card} p-5`}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!note.trim()) return;
                    addNote(order.id, note, user.name);
                    setNote("");
                  }}
                >
                  <SectionTitle
                    title="Internal note"
                    lede="Visible to the operations team only."
                  />
                  <div className="mt-3 flex items-start gap-3">
                    <Avatar name={user.name} tone="person" />
                    <div className="flex-1">
                      <textarea
                        value={note}
                        onChange={(event) => setNote(event.target.value)}
                        rows={3}
                        className={fieldInput}
                        placeholder="Add context for the next person who opens this job…"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={!note.trim()}
                          className={primaryButton}
                        >
                          Add note
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
                <section className={`${card} p-5`}>
                  <SectionTitle title="Notes" />
                  {(order.notes ?? []).length === 0 ? (
                    <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                      <MessageSquare size={14} /> No notes yet.
                    </p>
                  ) : (
                    <ul className="mt-4 space-y-4">
                      {(order.notes ?? []).map((item) => (
                        <li key={item.id} className="flex gap-3">
                          <Avatar name={item.author} tone="person" size="sm" />
                          <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-[#faf8f4] px-4 py-3">
                            <p className="text-xs text-muted">
                              <span className="font-semibold text-ink">
                                {item.author}
                              </span>{" "}
                              · {timeLabel(item.at)}
                            </p>
                            <p className="mt-1 text-sm leading-6 text-ink">
                              {item.body}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <p className="flex items-center gap-2.5 rounded-2xl border border-dashed border-[#e6dfd4] px-5 py-4 text-sm text-muted">
                  <Lock size={14} />
                  Customer messages are not sent from this platform. Client
                  contact stays with operations.
                </p>
              </>
            ) : null}

            {tab === "Activity" ? (
              <>
                <section className={`${card} p-5`}>
                  <SectionTitle
                    title="Timeline"
                    lede="Every move on this job, oldest first."
                  />
                  {history.length ? (
                    <Timeline events={history} />
                  ) : (
                    <p className="mt-3 text-sm text-muted">
                      No events on this job yet.
                    </p>
                  )}
                </section>
                <section className={`${card} overflow-hidden`}>
                  <div className="p-5 pb-3">
                    <SectionTitle
                      title="Audit log"
                      lede="Who changed what, and when. Read-only."
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead>
                        <tr className="border-y border-[#f0ebe3] text-[12px] text-[#8a8278]">
                          <th className="py-2.5 pl-5 pr-3 font-medium">When</th>
                          <th className="px-3 py-2.5 font-medium">Who</th>
                          <th className="px-3 py-2.5 font-medium">Action</th>
                          <th className="py-2.5 pl-3 pr-5 font-medium">
                            Detail
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...history].reverse().map((item) => (
                          <tr
                            key={item.id}
                            className="border-b border-[#f4f0e9] last:border-b-0"
                          >
                            <td className="whitespace-nowrap py-3 pl-5 pr-3 tabular text-muted">
                              {timeLabel(item.at)}
                            </td>
                            <td className="px-3 py-3 font-medium">
                              {item.actor}
                            </td>
                            <td className="px-3 py-3">{item.action}</td>
                            <td className="py-3 pl-3 pr-5 text-muted">
                              {item.detail}
                            </td>
                          </tr>
                        ))}
                        {history.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-5 py-6 text-muted">
                              No events on this job yet.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            ) : null}
          </div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-0 lg:self-start">
          <section className="overflow-hidden rounded-2xl bg-ink text-white">
            <div className="px-5 pb-4 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#b3aca2]">
                Next step
              </p>
              <p className="mt-1.5 text-lg font-semibold leading-snug">
                {nextStepHeadline(
                  order,
                  steps.length > 0,
                  needsPerson,
                  awaitingAcceptance,
                )}
              </p>
              <p className="mt-1 text-sm text-[#c9c3ba]">
                Now: {STATUS_LABEL[order.status]}
                {stageOf(order.status)
                  ? ` · ${stageOf(order.status)!.label}`
                  : ""}
              </p>
            </div>
            <div className="space-y-2 border-t border-white/10 bg-white/[0.04] px-5 py-4">
              {steps
                .filter((step) => step.to !== "SCHEDULED")
                .map((step) => {
                  const blocked =
                    step.gate === "documentation" && !documentationReady(order);
                  return (
                    <button
                      key={step.to}
                      type="button"
                      disabled={blocked}
                      onClick={() => run(step.to)}
                      className="flex h-11 w-full items-center justify-between rounded-xl bg-amber px-4 text-sm font-semibold text-ink transition hover:bg-amber-deep disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-[#8f887e]"
                    >
                      <span className="flex items-center gap-2">
                        {blocked ? <Lock size={14} /> : null}
                        {step.label}
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  );
                })}
              {steps.some((step) => step.to === "SCHEDULED") ? (
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    schedule(order.id, when, user.name);
                  }}
                >
                  <label
                    className="block text-xs text-[#c9c3ba]"
                    htmlFor="schedule-when"
                  >
                    On site
                  </label>
                  <input
                    id="schedule-when"
                    type="datetime-local"
                    value={when}
                    onChange={(event) => setWhen(event.target.value)}
                    className="h-10 w-full rounded-xl bg-white/10 px-3 text-sm text-white outline-none [color-scheme:dark] focus:ring-2 focus:ring-amber/50"
                  />
                  <button
                    type="submit"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber text-sm font-semibold text-ink transition hover:bg-amber-deep"
                  >
                    <CalendarClock size={15} />
                    Schedule
                  </button>
                </form>
              ) : null}
              {needsPerson ? (
                <button
                  type="button"
                  onClick={() => setTab("Assignment")}
                  className="flex h-11 w-full items-center justify-between rounded-xl bg-amber px-4 text-sm font-semibold text-ink transition hover:bg-amber-deep"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus size={15} />
                    Assign someone
                  </span>
                  <ArrowRight size={16} />
                </button>
              ) : null}
              {steps.length === 0 && !needsPerson ? (
                <p className="text-sm leading-6 text-[#c9c3ba]">
                  {open
                    ? `No status move is available for ${user.title.toLowerCase()} from ${STATUS_LABEL[order.status].toLowerCase()}.`
                    : "This job is closed. Nothing left to move."}
                </p>
              ) : null}
              {steps.some((step) => step.gate === "documentation") &&
              gaps.length > 0 ? (
                <ul className="space-y-1 pt-1 text-xs text-[#d9b98d]">
                  {gaps.map((gap) => (
                    <li key={gap} className="flex items-center gap-1.5">
                      <ShieldAlert size={12} /> {gap}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <section className={`${card} p-5`}>
            <SectionTitle title="Details" />
            <dl className="mt-3 divide-y divide-[#f4f0e9] text-sm">
              <Detail label="Due">
                <span className={open ? due.tone : ""}>
                  {longDate(order.dueAt)}
                </span>
              </Detail>
              <Detail label="On site">
                {order.scheduledStart ? (
                  timeLabel(order.scheduledStart)
                ) : (
                  <span className="text-muted">Not scheduled</span>
                )}
              </Detail>
              <Detail label="Source">
                {SOURCE_LABEL[order.source]}{" "}
                <span className="text-muted">· {order.externalId}</span>
              </Detail>
              <Detail label="Service">{SERVICE_LABEL[order.service]}</Detail>
              <Detail label="Inspection">
                {order.inspectionRequired ? "Required" : "Not required"}
              </Detail>
              {showMoney && order.approvedAmount != null ? (
                <Detail label="Approved">{money(order.approvedAmount)}</Detail>
              ) : null}
            </dl>
          </section>

          <section className={`${card} p-5`}>
            <SectionTitle title="People and place" />
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="mb-2 text-[12px] font-medium text-[#8a8278]">
                  Assigned
                </p>
                {assigned ? (
                  <AssigneeCell order={order} />
                ) : (
                  <p className="text-[#b33a3a]">{assigneeLabel(order)}</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-[12px] font-medium text-[#8a8278]">
                  Property
                </p>
                <Link
                  href={`/properties/${order.propertyId}`}
                  className="group flex items-start gap-2.5"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f3efe6] text-[#6d655c]">
                    <MapPin size={15} />
                  </span>
                  <span>
                    <span className="block font-medium text-ink group-hover:text-copper">
                      {property.name}
                    </span>
                    <span className="block text-xs text-muted">
                      {property.address}, {property.city}, {property.state}
                    </span>
                  </span>
                </Link>
              </div>
              <div>
                <p className="mb-2 text-[12px] font-medium text-[#8a8278]">
                  Customer
                </p>
                <div className="flex items-start gap-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#f3efe6] text-[#6d655c]">
                    <Building2 size={15} />
                  </span>
                  <span className="min-w-0">
                    {showContact ? (
                      <>
                        <Link
                          href={`/customers/${order.customerId}`}
                          className="block font-medium text-ink hover:text-copper"
                        >
                          {customerName(order.customerId)}
                        </Link>
                        {customer ? (
                          <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                            <Phone size={11} /> {customer.contactName} ·{" "}
                            {customer.phone}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <span className="block font-medium text-ink">
                          {customerName(order.customerId)}
                        </span>
                        <span className="block text-xs text-muted">
                          Contact details stay with operations.
                        </span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StageStepper({ status }: { status: JobStatus }) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const stageIndex = STAGES.findIndex((stage) =>
    stage.statuses.includes(status),
  );
  const closed = status === "CLOSED";
  return (
    <section className={`${card} mt-6 px-5 py-4`}>
      <ol className="grid grid-cols-5 gap-2">
        {STAGES.map((stage, index) => {
          const done = index < stageIndex || closed;
          const current = index === stageIndex && !closed;
          const inStage = stage.statuses.map((value) =>
            STATUS_ORDER.indexOf(value),
          );
          const reached = inStage.filter(
            (value) => value <= currentIndex,
          ).length;
          return (
            <li key={stage.id} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${
                    done
                      ? "bg-ink text-white"
                      : current
                        ? "bg-amber text-ink ring-4 ring-amber/25"
                        : "bg-[#f0ebe3] text-[#a59d92]"
                  }`}
                >
                  {done ? <Check size={14} strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={`h-1 flex-1 rounded-full ${done ? "bg-ink" : "bg-[#f0ebe3]"}`}
                >
                  {current ? (
                    <span
                      className="block h-full rounded-full bg-amber"
                      style={{ width: `${(reached / inStage.length) * 100}%` }}
                    />
                  ) : null}
                </span>
              </div>
              <p
                className={`mt-2 truncate text-[13px] ${current ? "font-semibold text-ink" : done ? "text-ink" : "text-muted"}`}
              >
                {stage.label}
              </p>
              <p className="truncate text-[11px] text-muted">
                {current
                  ? STATUS_LABEL[status]
                  : done
                    ? "Done"
                    : `${stage.statuses.length} steps`}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function NavArrow({
  href,
  label,
  children,
}: {
  href?: string;
  label: string;
  children: React.ReactNode;
}) {
  const base =
    "grid h-8 w-8 place-items-center rounded-full border border-[#ece6dc] bg-white transition";
  if (!href)
    return (
      <span
        aria-label={label}
        className={`${base} cursor-not-allowed opacity-40`}
      >
        {children}
      </span>
    );
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`${base} text-ink hover:border-[#cfc6b8]`}
    >
      {children}
    </Link>
  );
}

function SectionTitle({
  title,
  lede,
  action,
}: {
  title: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {lede ? (
          <p className="mt-0.5 text-xs leading-5 text-muted">{lede}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function TextButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-xs font-semibold text-copper hover:underline"
    >
      {children}
    </button>
  );
}

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#f0ebe3]">
      <div
        className={`h-full rounded-full transition-all ${pct === 100 ? "bg-[#2f7a4a]" : "bg-amber"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Meter({
  icon: Icon,
  label,
  done,
  total,
  onOpen,
}: {
  icon: typeof Camera;
  label: string;
  done: number;
  total: number;
  onOpen: () => void;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = total > 0 && done === total;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-xl border border-[#ece6dc] p-4 text-left transition hover:border-[#cfc6b8]"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <span
            className={`grid h-8 w-8 place-items-center rounded-lg ${complete ? "bg-[#eaf4ea] text-[#2f7a4a]" : "bg-[#f3efe6] text-[#6d655c]"}`}
          >
            <Icon size={15} />
          </span>
          {label}
        </span>
        <span className="font-display text-xl tabular text-ink">
          {done}
          <span className="text-sm text-muted">/{total}</span>
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f0ebe3]">
        <div
          className={`h-full rounded-full ${complete ? "bg-[#2f7a4a]" : "bg-amber"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

function Chip({
  tone,
  children,
}: {
  tone: "good" | "warn" | "risk" | "info" | "muted";
  children: React.ReactNode;
}) {
  const tones = {
    good: "bg-[#e5f0e4] text-[#1d5a32]",
    warn: "bg-[#f8ecd4] text-[#7a4e08]",
    risk: "bg-[#f6dedb] text-[#9f2d2d]",
    info: "bg-[#e4ebf2] text-[#1e3a5f]",
    muted: "bg-[#f3efe6] text-[#5e574e]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{children}</dd>
    </div>
  );
}

function MoneyTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-xl bg-[#faf8f4] px-4 py-3.5">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular leading-none text-ink">
        {value}
      </dd>
      {note ? <p className="mt-1.5 text-xs text-[#2f7a4a]">{note}</p> : null}
    </div>
  );
}

type TimelineEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
};

function Timeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="relative mt-4">
      <span
        className="absolute bottom-3 left-[13px] top-3 w-px bg-[#efe9df]"
        aria-hidden
      />
      {events.map((item) => (
        <li key={item.id} className="relative flex gap-3 py-2">
          <Avatar
            name={item.actor}
            tone={item.actor === "System" ? "system" : "person"}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">
              <span className="font-semibold">{item.actor}</span>{" "}
              {item.action.toLowerCase()}
            </p>
            <p className="text-xs text-muted">
              {item.detail} · {timeLabel(item.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function nextStepHeadline(
  order: WorkOrder,
  hasMove: boolean,
  needsPerson: boolean,
  awaitingAcceptance: boolean,
) {
  if (!isOpen(order))
    return order.status === "CLOSED" ? "Job closed" : "Waiting on billing";
  if (needsPerson) return "Put someone on this job";
  if (awaitingAcceptance) return "Waiting on the contractor to accept";
  if (order.status === "AWAITING_DOCUMENTATION" && !documentationReady(order))
    return "Finish the documentation";
  if (!hasMove) return "Nothing for you to move";
  const map: Partial<Record<JobStatus, string>> = {
    NEW: "Review the request",
    REVIEW: "Decide inspection or estimate",
    INSPECTION_REQUIRED: "Complete the inspection",
    INSPECTION_COMPLETE: "Price the work",
    ESTIMATE_PREPARING: "Send for approval",
    AWAITING_APPROVAL: "Approve the estimate",
    APPROVED: "Release to dispatch",
    ASSIGNED: "Set the on-site time",
    SCHEDULED: "Start the job on site",
    IN_PROGRESS: "Check out when the work is done",
    AWAITING_DOCUMENTATION: "Submit the package for review",
    SUBMITTED_FOR_REVIEW: "Review the completed package",
    COMPLETED: "Hand the invoice to JobTread",
    INVOICED: "Close once payment lands",
  };
  return map[order.status] ?? "Move the job forward";
}

function timeline(order: WorkOrder) {
  const seeded = auditEvents
    .filter((item) => item.entityId === order.id)
    .map((item) => ({
      id: item.id,
      at: item.at,
      actor: item.actor,
      action: item.action,
      detail: item.detail,
    }));
  return [...seeded, ...(order.events ?? [])].sort((a, b) =>
    a.at.localeCompare(b.at),
  );
}
